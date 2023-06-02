const { PackageAnalyzer } = require('../../package-analyzer')
const { Registry } = require('../../registry')

const registry = new Registry()
const analyzer = new PackageAnalyzer(registry)

describe('interactive tests', () => {
  it('outdated', async () => {
    const pkg = require('./outdated/package.json')
    const pkgLock = require('./outdated/package-lock.json')
    const result = await analyzer.analyze(pkg, pkgLock)
    console.log(result)
  })
})
