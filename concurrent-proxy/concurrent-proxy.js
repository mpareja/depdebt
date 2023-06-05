import PQueue from 'p-queue'

// Returns a worker proxy whose functions ONLY block when they cannot be
// queued for future processing.
/*
@typedef {{ telemetry: any, concurrency: number, defaultQueueLimit: number }} Option
@param any target
@param Options options
@returns {{ proxy, onFinished }}
 */
export function createProxy (target, options = {}) {
  const telemetry = options.telemetry ?? new NullTelemetry()
  const queues = new Map()

  let inFlight = 0
  const errors = []

  const proxy = createChildProxy(target)

  const abort = () => {
    for (const queue of queues.values()) {
      queue.clear()
    }
  }

  const onFinished = async () => {
    telemetry.onFinishedStarted(queues.size)
    while (true) {
      await Promise.all([...queues.values()].map(queue => queue.onIdle()))
      if (inFlight === 0) {
        break
      }
    }

    telemetry.onFinishedCompleted(queues.size, errors)
    if (errors.length > 0) {
      const message = `Error${errors.length > 1 ? 's' : ''} encountered during concurrent processing`
      throw new Error(message, { cause: { errors } })
    }
  }

  function createChildProxy (target) {
    return new Proxy(target, {
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
              try {
                await target[key].apply(receiver, args)
              } catch (e) {
                telemetry.onError(key, args, e)
                errors.push(e)
                abort()
              }
              inFlight--
              telemetry.completed(key, args)
            })
          }
        } else {
          return target[key]
        }
      }
    })
  }

  return { proxy, onFinished, createChildProxy, queues }
}

export class NullTelemetry {
  enqueuing (key, args) {}
  started (key, args) {}
  completed (key, args) {}
  onFinishedStarted () {}
  onFinishedCompleted () {}
  onQueueLimitReached (key, args, limit, pending) {}
  onError (key, args, e) {}
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

  onFinishedCompleted (size, errors) {
    const errorNum = errors.length
    const errMessage =
      errorNum === 1
        ? ', 1 error'
        : errorNum > 1
          ? `, ${errorNum} errors`
          : ''
    console.log(`onFinished: completed (${size} queues${errMessage})`)
  }

  onQueueLimitReached (key, args, limit, pending) {
    console.log(`${key}(${args}): queue limit of ${limit} reached with ${pending} in-flight`)
  }

  onError (key, args, e) {
    console.log(`${key}(${args}): ERROR:`, e)
  }
}
