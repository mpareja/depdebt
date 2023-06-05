import { createProxy } from '../concurrent-proxy.js'
import { promisify } from 'util'
import { exampleString } from '../../examples/example-string.js'

const delay = promisify(setTimeout)

describe('concurrent-proxy', () => {
  const options = { concurrency: 1 /* , telemetry: new ConsoleLogTelemetry() */ }

  it('original behaviour is observed', async () => {
    const original = new ExampleWorker()
    const { proxy, onFinished } = createProxy(original, options)

    await proxy.processDir('some-dir', 12)
    await onFinished()

    expect(proxy.found).toHaveLength(12)
    expect(proxy.processed).toHaveLength(12)
    expect(original.found).toHaveLength(12)
    expect(original.processed).toHaveLength(12)
  })

  it('processing is not blocked by downstream work', async () => {
    const original = new ExampleWorker()
    const { proxy, onFinished } = createProxy(original, options)

    // kick off processing. Keep in mind, this only blocks
    // if the queue is full.
    await proxy.processDir('some-dir', 5)

    // 10ms is how long dir takes to read
    // 50ms is how long it takes to process all files
    // We expect processDir to complete by 20ms despite processFile
    // not having finished
    await delay(20)

    const foundCount = proxy.found.length
    const processedCount = proxy.processed.length

    await onFinished() // for cleanliness ensure complete before we start doing our assertions

    expect(foundCount).toBe(5)
    expect(processedCount).toBeLessThan(5)

    expect(proxy.found.length).toBe(5)
    expect(proxy.processed.length).toBe(5)
  })

  it('processing is blocked by enqueuing when limit is hit', async () => {
    // make the file processing slow and limit the queue length to cause blocking
    const fileMs = 100
    const options = { concurrency: 1, defaultQueueLimit: 2 }

    const original = new ExampleWorker({ fileMs })
    const { proxy, onFinished } = createProxy(original, options)

    // kick off processing
    await proxy.processDir('some-dir', 5)

    // 10ms is how long dir takes to read
    // we expect processDir to have had an opportunity to enqueue
    await delay(20)

    const foundCount = proxy.found.length
    const processedCount = proxy.processed.length

    original.fileMs = 0 // make processing instant so test completes quickly
    await onFinished() // for cleanliness ensure complete before we start doing our assertions

    // we expect 4 entries in foundCount because:
    // 1. the first file is processed immediately
    // 2. the second file is enqueued
    // 3. the third file is enqueued
    // 4. the fourth file is added to array, and _then_ blocking happens
    expect(foundCount).toBe(4)
    expect(processedCount).toBeLessThan(3)

    expect(proxy.found.length).toBe(5)
    expect(proxy.processed.length).toBe(5)
  })

  describe('error handling', () => {
    it('propagates error encountered', async () => {
      const original = new FailingExampleWorker()
      const opts = { concurrency: 2 }
      const { proxy, onFinished } = createProxy(original, opts)

      await proxy.start()

      const error = await onFinished().catch(e => e)

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Error encountered during concurrent processing')
    })

    it('propagates error encountered', async () => {
      const original = new FailingExampleWorker()
      const { proxy, onFinished } = createProxy(original, options)

      await proxy.start(1)

      const error = await onFinished().catch(e => e)

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Errors encountered during concurrent processing')
      expect(error.cause.errors).toMatchObject([
        { message: 'example error: start' },
        { message: 'example error: child' }
      ])
    })

    it('aborts queued tasks', async () => {
      const original = new FailingExampleWorker()
      const { proxy, onFinished } = createProxy(original, options)

      await proxy.start(100)

      const error = await onFinished().catch(e => e)

      // expect much less than then the 101 (parent + 100 child) errors because
      // queues will be cleared before they are all processed
      expect(error.cause.errors.length).toBeLessThan(50)
    })
  })
})

describe('ExampleWorker', () => {
  it('pretends to find and process files', async () => {
    const proxy = new ExampleWorker()

    await proxy.processDir('some-dir', 12)

    expect(proxy.found).toHaveLength(12)
    expect(proxy.processed).toHaveLength(12)
  })
})

class FailingExampleWorker {
  async start (childErrors = 0) {
    await delay(1)

    while (childErrors-- > 0) {
      await this.child()
    }

    throw new Error('example error: start')
  }

  async child () {
    await delay(1)

    throw new Error('example error: child')
  }
}

class ExampleWorker {
  found = []
  processed = []

  constructor (options = {}) {
    this.dirMs = options.dirMs ?? 10
    this.fileMs = options.fileMs ?? 10
  }

  async processDir (dir, numOfFiles = 10) {
    // pretend to list files in dir
    await delay(this.dirMs)
    while (numOfFiles-- > 0) {
      const file = exampleString()
      this.found.push(file)
      await this.processFile(file)
    }
  }

  // pretend to load and process file data
  async processFile (file) {
    await delay(this.fileMs)
    this.processed.push(file)
  }
}
