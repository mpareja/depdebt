import { PackageAnalyzer } from '../package-analyzer.js'
import { SubstituteRegistry } from '../registry.js'
import { examplePackageJson } from '../examples/example-package-json.js'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

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

      const filepath = new URL('fixtures/node-package-lock.json', import.meta.url)
      const pkgLock = JSON.parse(await fs.readFile(filepath))

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

  describe('actualTime', () => {
    it('matches the published time of package version that is currently in use', async () => {
      const { analyzer, packageJson } = setup()

      const result = await analyzer.analyze(packageJson)

      expect(result.node.actualTime).toBe('2023-04-01T02:37:56.936Z')
    })
  })

  describe('latest metadata', () => {
    it('matches the "latest" release metadata', async () => {
      const { analyzer, packageJson } = setup()

      const result = await analyzer.analyze(packageJson)

      expect(result.node.latest).toBe('20.2.0')
      expect(result.node.latestTag).toBe('latest')
      expect(result.node.latestTime).toBe('2023-05-18T04:06:51.378Z')
    })

    describe('given a tagPrecedence of ["lts", "latest"]', () => {
      const tagPrecedence = ['lts', 'latest']

      describe('package with an "lts" tag', () => {
        it('matches the "lts" release metadata', async () => {
          const { analyzer, packageJson } = setup({ tagPrecedence })

          const result = await analyzer.analyze(packageJson)

          expect(result.node.latest).toBe('18.14.0')
          expect(result.node.latestTag).toBe('lts')
          expect(result.node.latestTime).toBe('2023-02-03T05:04:43.531Z')
        })
      })

      describe('given a package without an "lts" tag', () => {
        it('latestTime matches the "latest" release published date', async () => {
          const { analyzer, packageJson } = setup({ tagPrecedence })

          const result = await analyzer.analyze(packageJson)

          expect(result['is-obj'].latestTag).toBe('latest')
          expect(result['is-obj'].latest).toBe('3.0.0')
          expect(result['is-obj'].latestTime).toBe('2021-04-16T19:05:38.181Z')
        })
      })
    })

    describe('invalid tag precedence', () => {
      it('is an error', async () => {
        const { analyzer, packageJson } = setup({ tagPrecedence: ['bogus'] })

        const error = await analyzer.analyze(packageJson).catch(e => e)

        expect(error).toBeInstanceOf(Error)
        expect(error.cause.errors[0].message).toEqual('none of the expected tags were found: ["bogus"]')
      })
    })
  })

  describe('libyear', () => {
    it('is the sum of dependency libyears', async () => {
      const { analyzer, packageJson } = setup()

      const result = await analyzer.analyze(packageJson)

      expect(result.libyears).toBe(5.201180228088534)
    })

    describe('dependency.libyear', () => {
      it('is the number of years between actualTime and latestTime', async () => {
        const { analyzer, packageJson } = setup()

        const result = await analyzer.analyze(packageJson)

        // actualTime: 2016-03-22T10:14:12.950Z
        // latestTime: 2021-04-16T19:05:38.181Z
        expect(result['is-obj'].libyears).toBe(5.072243950754693)

        expect(result.node.libyears).toBe(0.1289362773338407)
      })
    })
  })

  describe('analyzePackages', () => {
    it('sums libyears across all package.json files', async () => {
      const { analyzer } = setup()

      const dir = fileURLToPath(new URL('interactive', import.meta.url))
      const first = path.join(dir, 'outdated', 'package.json')
      const second = path.join(dir, 'nested', 'outdated', 'package.json')
      const packageJsonPaths = [first, second]

      const result = await analyzer.anaylzePackages(packageJsonPaths)

      expect(result.libyears).toBe(10.144487901509386)
      expect(result[first]).toBeDefined()
      expect(result[second]).toBeDefined()
    })
  })
})

function setup (options) {
  const registry = new SubstituteRegistry()
  const analyzer = new PackageAnalyzer(registry, options)

  const packageJson = examplePackageJson.noDeps({
    dependencies: {
      node: '^16.14.2',
      'is-obj': '^1.0.0'
    }
  })

  return { analyzer, packageJson, registry }
}
