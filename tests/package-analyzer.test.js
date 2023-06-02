const { PackageAnalyzer } = require('../package-analyzer')
const { examplePackageJson } = require('../examples/example-package-json')
const { SubstituteRegistry } = require('../registry')

describe('package-analyzer', () => {
  describe('no package-lock supplied', () => {
    it('ideal version matches specWanted', async () => {
      const { analyzer, packageJson } = setup()

      const result = await analyzer.analyze(packageJson)

      expect(result).toMatchObject({
        node: {
          actual: '16.20.0', // no package-lock.json supplied

          spec: '^16.14.2',
          specWanted: '16.20.0',

          tags: {
            latest: '20.2.0',
            lts: '18.14.0'
          }
        }
      })
    })
  })

  describe('package-lock supplied', () => {
    it('ideal version matches package-lock.json version', async () => {
      const { analyzer, packageJson } = setup()

      const pkgLock = require('./fixtures/node-package-lock.json')

      const result = await analyzer.analyze(packageJson, pkgLock)

      expect(result).toMatchObject({
        node: {
          actual: '16.17.0', // from package-lock.json

          spec: '^16.14.2',
          specWanted: '16.20.0',

          tags: {
            latest: '20.2.0',
            lts: '18.14.0'
          }
        }
      })
    })
  })
})

function setup () {
  const registry = new SubstituteRegistry()
  const analyzer = new PackageAnalyzer(registry)

  const packageJson = examplePackageJson.noDeps({
    dependencies: {
      node: '^16.14.2'
    }
  })

  return { analyzer, packageJson, registry }
}
