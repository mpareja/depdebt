#!/usr/bin/env node

import path from 'path'
import { PackageAnalyzer } from '../package-analyzer.js'
import { Registry } from '../registry.js'
import { StderrTelemetry } from '../concurrent-proxy/stderr-telemetry.js'
import { parseArgs } from 'node:util'

async function main () {
  const { values, positionals } = parseArguments()
  if (values.help) {
    printUsage()
    return
  }

  const registry = new Registry()
  const analyzer = new PackageAnalyzer(registry, {
    tagPrecedence: values.tagPrecedence,
    missingPackageStrategy: values.missing,
    telemetry: new StderrTelemetry()
  })

  const lines = values.stdin
    ? readLines(process.stdin)
    : positionals

  const packageJsonPaths = resolvePaths(lines)

  const result = await analyzer.anaylzePackages(packageJsonPaths)

  console.log(JSON.stringify(result, null, 2))
}

function parseArguments () {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    strict: true,
    options: {
      tagPrecedence: {
        type: 'string',
        multiple: true,
        short: 't',
        default: ['latest']
      },
      missing: {
        type: 'string',
        short: 'm',
        default: 'throw'
      },
      help: {
        type: 'boolean',
        short: 'h'
      }
    }
  })

  if (positionals.length === 0) {
    positionals.push('package.json')
  } else if (positionals[0] === '-') {
    values.stdin = true
  }

  return { values, positionals }
}

function printUsage () {
  console.log('Usage: depdebt [options] [package.json ...]')
  console.log()
  console.log('Options:')
  console.log('  -t, --tag-precedence <tag>  Tag precedence (default: latest, supports multiple)')
  console.log('  -m, --missing <strategy>    Missing package strategy (default: throw, supports ignore) ')
  console.log('  -h, --help                  Show this help')
  console.log()
  console.log('If file names are not supplied on the command line, defaults to "package.json". The special file name "-" instructs depdebt to listens for newline delimited file names from stdin.')
  console.log()
  console.log('Examples:')
  console.log('  depdebt package.json')
  console.log('  depdebt -t lts -t latest package.json')
  console.log('  find -name package.json -not -path \'*/node_modules/*\' | depdebt')
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
