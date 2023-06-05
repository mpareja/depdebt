import pickManifest from 'npm-pick-manifest'
import { createExecutor } from './concurrent-proxy/concurrent-proxy.js'
import { promises as fs } from 'fs'

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

class DirectoryAnalysis {
  async analyzePackages (packageJsonPaths, analyzePackage) {
    for await (const packageJsonPath of packageJsonPaths) {
      const packageLockJsonPath = packageJsonPath.replace(/package\.json$/, 'package-lock.json')
      const [pkg, pkgLock] = await Promise.allSettled([
        fs.readFile(packageJsonPath, 'utf8'),
        fs.readFile(packageLockJsonPath, 'utf8')
      ])

      if (pkg.status === 'rejected') {
        throw pkg.reason
      }
      const packageJson = JSON.parse(pkg.value)

      let packageLockJson = null
      if (pkgLock.status === 'fulfilled') {
        packageLockJson = JSON.parse(pkgLock.value)
      }

      await analyzePackage(packageJsonPath, packageJson, packageLockJson)
    }
  }
}

class PackageAnalysis {
  result = { libyears: 0 } // shared mutable state, only 1 task should write to registers

  constructor (registry, options) {
    this.registry = registry
    this.options = options
  }

  async anaylzePackages (packageJsonPaths) {
    for await (const packageJsonPath of packageJsonPaths) {
      const packageLockJsonPath = packageJsonPath.replace(/package\.json$/, 'package-lock.json')
      const [pkg, pkgLock] = await Promise.allSettled([
        fs.readFile(packageJsonPath, 'utf8'),
        fs.readFile(packageLockJsonPath, 'utf8')
      ])

      if (pkg.status === 'rejected') {
        throw pkg.reason
      }
      const packageJson = JSON.parse(pkg.value)

      let packageLockJson = null
      if (pkgLock.status === 'fulfilled') {
        packageLockJson = JSON.parse(pkgLock.value)
      }

      await this.analyze(packageJson, packageLockJson)
    }
  }

  async analyze (packageJson, packageLockJson) {
    for (const [dep, spec] of Object.entries(packageJson.dependencies ?? {})) {
      this.result[dep] = { spec }
      await this.getDepMetadata(dep, packageLockJson)
    }
  }

  async getDepMetadata (dep, packageLockJson) {
    const packument = await this.registry.getPackument(dep)
    const tags = packument['dist-tags']

    const dependency = this.result[dep]
    dependency.tags = { ...tags }
    dependency.specWanted = pickManifest(packument, dependency.spec).version

    dependency.actual =
      // if package-lock.json is committed to repo, use that
      packageLockJson?.packages?.['node_modules/node']?.version ??
      // otherwise, use whatever the version-spec would have installed
      dependency.specWanted

    dependency.actualTime = packument.time[dependency.actual]

    const precedence = this.options.tagPrecedence
    const tag = precedence.find(tag => !!dependency.tags[tag])
    if (!tag) {
      throw new Error(`none of the expected tags were found: ${JSON.stringify(precedence)}`)
    }

    const version = dependency.tags[tag]
    dependency.latest = version
    dependency.latestTag = tag
    dependency.latestTime = packument.time[version]
    dependency.libyears = getDecimalYears(dependency.actualTime, dependency.latestTime)

    this.result.libyears += dependency.libyears
  }
}

// this doesn't handle leap years, but a day here or there doesn't matter
function getDecimalYears (date1, date2) {
  const diffTime = Math.abs(new Date(date2) - new Date(date1))
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  const diffYears = diffDays / 365
  return diffYears
}
