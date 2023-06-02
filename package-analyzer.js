const pickManifest = require('npm-pick-manifest')

class PackageAnalyzer {
  constructor (registry, options) {
    this.registry = registry
    this.options = Object.assign({
      tagPrecedence: ['latest']
    }, options)
  }

  async analyze (packageJson, packageLockJson) {
    const runner = new AnalysisRunner(this.registry, this.options)

    return runner.analyze(packageJson, packageLockJson)
  }
}

class Runner {
  async process (current) {
    // ultimately, we'll want to process work items concurrently with
    // back pressure at enqueu time
    for await (const next of this[current.task](...current.args)) {
      await this.process(next)
    }
  }
}

class AnalysisRunner extends Runner {
  result = {} // shared mutable state, only 1 task should write to registers

  constructor (registry, options) {
    super()
    this.registry = registry
    this.options = options
  }

  async analyze (packageJson, packageLockJson) {
    await this.process({ task: 'analyzePackage', args: [packageJson, packageLockJson] })
    return this.result
  }

  async * analyzePackage (packageJson, packageLockJson) {
    for (const [dep, spec] of Object.entries(packageJson.dependencies)) {
      this.result[dep] = { spec }
      yield { task: 'getDepMetadata', args: [dep, packageLockJson] }
    }
  }

  async * getDepMetadata (dep, packageLockJson) {
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
    if (tag) {
      const version = dependency.tags[tag]
      dependency.latest = version
      dependency.latestTag = tag
      dependency.latestTime = packument.time[version]
    } else {
      throw new Error(`none of the expected tags were found: ${JSON.stringify(precedence)}`)
    }
  }
}
module.exports = { PackageAnalyzer }
