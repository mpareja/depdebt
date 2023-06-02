const fs = require('fs').promises
const pickManifest = require('npm-pick-manifest')

class PackageAnalyzer {
  async analyze (packageJson, packageLockJson) {
    const runner = new AnalysisRunner()

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
  result = {}

  async analyze (packageJson, packageLockJson) {
    await this.process({ task: 'analyzePackage', args: [packageJson, packageLockJson] })
    return this.result
  }

  async * analyzePackage (packageJson, packageLockJson) {
    for (const [dep, spec] of Object.entries(packageJson.dependencies)) {
      this.result[dep] = { spec }
      yield { task: 'getDepVersions', args: [dep, packageLockJson] }
    }
  }

  async * getDepVersions (dep, packageLockJson) {
    const data = await fs.readFile('./test/fixtures/node-packument.json', 'utf8')
    const packument = JSON.parse(data)
    const tags = packument['dist-tags']

    const dependency = this.result[dep]
    Object.assign(dependency, {
      latest: tags.latest,
      lts: tags.lts,

      specWanted: pickManifest(packument, dependency.spec).version
    })

    yield { task: 'getActualVersion', args: [dep, packageLockJson] }
  }

  async * getActualVersion (dep, packageLockJson) {
    const dependency = this.result[dep]
    dependency.actual =
      // if package-lock.json is committed to repo, use that
      packageLockJson?.packages?.['node_modules/node']?.version ??
      // otherwise, use whatever the version-spec would have installed
      dependency.specWanted
  }
}
module.exports = { PackageAnalyzer }
