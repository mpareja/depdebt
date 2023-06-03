import { PackageAnalyzer } from '../../package-analyzer.js'
import { Registry } from '../../registry.js'
import { promises as fs } from 'fs'

const registry = new Registry()
const analyzer = new PackageAnalyzer(registry)

describe('interactive tests', () => {
  it('outdated', async () => {
    const pkg = JSON.parse(await fs.readFile(new URL('outdated/package.json', import.meta.url)))
    const pkgLock = JSON.parse(await fs.readFile(new URL('outdated/package-lock.json', import.meta.url)))
    const result = await analyzer.analyze(pkg, pkgLock)
    console.log(result)
  })
})
