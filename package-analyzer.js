import { createExecutor } from './concurrent-proxy/concurrent-proxy.js'
import { PackageAnalysis } from './package-analysis.js'
import { DirectoryAnalysis } from './directory-analysis.js'

export class PackageAnalyzer {
  constructor (registry, options) {
    this.registry = registry
    this.options = Object.assign({
      tagPrecedence: ['latest']
    }, options)
  }

  async analyze (packageJson, packageLockJson) {
    const options = { concurrency: 1, defaultQueueLimit: 10 }
    const { createProxy, onFinished } = createExecutor(options)
    const analyzer = createProxy(new PackageAnalysis(this.registry, this.options))

    await analyzer.analyze(packageJson, packageLockJson)
    await onFinished()

    return analyzer.result
  }

  async anaylzePackages (packageJsonPaths) {
    const options = { concurrency: 100 }
    const { createProxy, onFinished } = createExecutor(options)
    const analyzers = new Map()

    const directoryAnalysis = createProxy(new DirectoryAnalysis())

    await directoryAnalysis.analyzePackages(packageJsonPaths, async (packageJsonPath, pkg, pkgJson) => {
      const analyzer = createProxy(new PackageAnalysis(this.registry, this.options), options)
      analyzers.set(packageJsonPath, analyzer)
      await analyzer.analyze(pkg, pkgJson)
    })

    await onFinished()

    const result = { libyears: 0 }

    for (const [packageJsonPath, analyzer] of analyzers.entries()) {
      result[packageJsonPath] = analyzer.result
      result.libyears += analyzer.result.libyears
    }

    return result
  }
}
