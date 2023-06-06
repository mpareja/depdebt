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
