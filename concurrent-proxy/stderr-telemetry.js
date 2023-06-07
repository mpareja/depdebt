import { NullTelemetry } from './null-telemetry.js'
import { format } from 'node:util'

export class StderrTelemetry extends NullTelemetry {
  onError (key, args, e) {
    process.stderr.write(`${key}(${args}): ${format(e)}\n`)
  }
}
