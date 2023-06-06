import { createExecutor } from './concurrent-proxy/concurrent-proxy.js'
import { PackageAnalysis } from './package-analysis.js'
import { DirectoryAnalysis } from './directory-analysis.js'

export class PackageAnalyzer {
  constructor (registry, options = {}) {
    this.registry = registry

    const { tagPrecedence, missingPackageStrategy, ...executorOptions } = options
    this.analysisOptions = {
      tagPrecedence: options.tagPrecedence ?? ['latest'],
      missingPackageStrategy: options.missingPackageStrategy ?? 'throw'
    }
    this.executorOptions = Object.assign({
      concurrency: options.concurrency ?? 25,
      defaultQueueLimit: options.defaultQueueLimit ?? 100
    }, executorOptions)
  }

  async analyze (packageJson, packageLockJson) {
    const { createProxy, onFinished } = createExecutor(this.executorOptions)
    const analyzer = createProxy(new PackageAnalysis(this.registry, this.analysisOptions))

    await analyzer.analyze(packageJson, packageLockJson)
    await onFinished()

    return analyzer.result
  }

  async anaylzePackages (packageJsonPaths) {
    const { createProxy, onFinished } = createExecutor(this.executorOptions)
    const analyzers = new Map()

    const directoryAnalysis = createProxy(new DirectoryAnalysis())

    await directoryAnalysis.analyzePackages(packageJsonPaths, async (packageJsonPath, pkg, pkgJson) => {
      const analyzer = createProxy(new PackageAnalysis(this.registry, this.analysisOptions))
      analyzers.set(packageJsonPath, analyzer)
      await analyzer.analyze(pkg, pkgJson)
    })

    await onFinished()

    const result = { packages: {}, ...this.analysisOptions, libyears: 0 }

    for (const [packageJsonPath, analyzer] of analyzers.entries()) {
      result.packages[packageJsonPath] = analyzer.result
      result.libyears += analyzer.result.libyears
    }

    return result
  }
}
