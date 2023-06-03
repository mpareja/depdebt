import PQueue from 'p-queue'

// Returns a worker proxy whose functions ONLY block when they cannot be
// queued for future processing.
export function createProxy (target, options = {}) {
  const telemetry = options.telemetry ?? new NullTelemetry()
  const queues = new Map()

  let inFlight = 0

  const proxy = new Proxy(target, {
    get (target, key, receiver) {
      if (typeof target[key] === 'function') {
        return async function (...args) {
          telemetry.enqueuing(key, args)

          let queue = queues.get(key)
          if (!queue) {
            queue = new PQueue(options)
            queues.set(key, queue)
          }

          const limit = options.defaultQueueLimit
          if (limit > 0 && queue.size >= limit) {
            // NOTE: limit + concurrency is the potential number of
            // jobs that will still be getting processed
            telemetry.onQueueLimitReached(key, args, limit, queue.pending)
            await queue.onSizeLessThan(limit)
          }

          queue.add(async () => {
            telemetry.started(key, args)
            inFlight++
            // TODO: throw if result is returned
            // TODO: handle errors
            await target[key].apply(receiver, args)
            inFlight--
            telemetry.completed(key, args)
          })
        }
      } else {
        return target[key]
      }
    }
  })

  const onFinished = async () => {
    telemetry.onFinishedStarted(queues.size)
    while (true) {
      await Promise.all([...queues.values()].map(queue => queue.onIdle()))
      if (inFlight === 0) {
        break
      }
    }
    telemetry.onFinishedCompleted(queues.size)
  }

  return { proxy, onFinished }
}

export class NullTelemetry {
  enqueuing (key, args) {}
  started (key, args) {}
  completed (key, args) {}
  onFinishedStarted () {}
  onFinishedCompleted () {}
  onQueueLimitReached (key, args, limit, pending) {}
}

export class ConsoleLogTelemetry {
  enqueuing (key, args) {
    console.log(`${key}(${args}): enqueuing`)
  }

  started (key, args) {
    console.log(`${key}(${args}): started`)
  }

  completed (key, args) {
    console.log(`${key}(${args}): completed`)
  }

  onFinishedStarted (size) {
    console.log(`onFinished: started (${size} queues)`)
  }

  onFinishedCompleted (size) {
    console.log(`onFinished: completed (${size} queues)`)
  }

  onQueueLimitReached (key, args, limit, pending) {
    console.log(`${key}(${args}): queue limit of ${limit} reached with ${pending} in-flight`)
  }
}
