#!/usr/bin/env node

import path from 'path'
import { PackageAnalyzer } from '../package-analyzer.js'
import { Registry } from '../registry.js'
import { NullTelemetry } from '../concurrent-proxy/concurrent-proxy.js'
import { format } from 'util'

class StderrTelemetry extends NullTelemetry {
  onError (key, args, e) {
    process.stderr.write(`${key}(${args}): ${format(e)}\n`)
  }
}

async function main () {
  const registry = new Registry()
  const analyzer = new PackageAnalyzer(registry, {
    tagPrecedence: ['lts', 'latest'],
    missingPackageStrategy: 'ignore',
    telemetry: new StderrTelemetry()
  })

  const packageJsonPaths = resolvePaths(readLines(process.stdin))

  const result = await analyzer.anaylzePackages(packageJsonPaths)

  console.log(JSON.stringify(result, null, 2))
}

async function * resolvePaths (stream) {
  for await (const line of stream) {
    yield path.resolve(process.cwd(), line)
  }
}

async function * readLines (stream) {
  let buffer = ''

  for await (const chunk of stream) {
    buffer += chunk
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop()
    for (const line of lines) {
      yield line
    }
  }
  if (buffer.length > 0) {
    yield buffer
  }
}

main()
