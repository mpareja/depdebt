const { PackageAnalyzer } = require('../package-analyzer')
const { examplePackageJson } = require('../examples/example-package-json')

it('ideal version is specWanted when no package-lock.json is supplied', async () => {
  const analyzer = new PackageAnalyzer()
  const pkg = examplePackageJson.noDeps({
    dependencies: {
      node: '^16.14.2'
    }
  })

  const result = await analyzer.analyze(pkg)

  expect(result).toEqual({
    node: {
      spec: '^16.14.2',

      specWanted: '16.20.0',

      actual: '16.20.0', // no package-lock.json supplied

      latest: '20.2.0',
      lts: '18.14.0'
    }
  })
})

it('ideal version is package-lock.json version', async () => {
  const analyzer = new PackageAnalyzer()
  const pkg = examplePackageJson.noDeps({
    dependencies: {
      node: '^16.14.2'
    }
  })
  const pkgLock = require('./fixtures/node-package-lock.json')

  const result = await analyzer.analyze(pkg, pkgLock)

  expect(result).toEqual({
    node: {
      spec: '^16.14.2',

      specWanted: '16.20.0',

      actual: '16.17.0', // from package-lock.json

      latest: '20.2.0',
      lts: '18.14.0'
    }
  })
})
