import babar from 'babar'
import { NullTelemetry } from './null-telemetry.js'

export class ChartTelemetry extends NullTelemetry {
  lastUpdated = new Date()
  first = true
  height = 15

  enqueuing (key, args, queues) { this.render(queues) }
  started (key, args, queues) { this.render(queues) }
  completed (key, args, queues) { this.render(queues) }

  render (queues) {
    if (this.recentlyUpdated()) {
      return
    }

    const [width] = process.stderr.getWindowSize()

    const queueSizes = [...queues.values()].map((queue, ix) => [ix, queue.size])
    const queueNames = [...queues.keys()].join(', ')

    const chart = babar(queueSizes, {
      caption: `Queue Sizes: ${queueNames}`,
      width: width - 5,
      height: this.height,
      yFractions: 0
    })

    // move back to top left of chart
    process.stderr.cursorTo(0)
    if (this.first) {
      this.first = false
    } else {
      process.stderr.moveCursor(0, -this.height - 1)
    }

    process.stderr.write('\n')
    process.stderr.write(chart)
    process.stderr.write('\n')

    this.lastUpdated = new Date()
  }

  recentlyUpdated () {
    return (new Date() - this.lastUpdated) < 50
  }
}
