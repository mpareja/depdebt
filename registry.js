import Config from '@npmcli/config'
import pacote from 'pacote'
import path from 'path'
import { createRequire } from 'node:module'
import { promises as fs } from 'fs'

const require = createRequire(import.meta.url)

export class Registry {
  constructor () {
    this.loadNpmConfigP = this.loadNpmConfig()
  }

  async loadNpmConfig () {
    // much of this is tediously recreated from staring at `npm` source code
    const npmPath = path.dirname(require.resolve('npm'))
    const utilsPath = path.resolve(npmPath, 'lib', 'utils', 'config', 'index.js')
    const { definitions, flatten, shorthands } = require(utilsPath)

    const config = new Config({
      npmPath,
      definitions,
      flatten,
      shorthands,
      argv: []
    })
    await config.load()

    this.config = config.flat
  }

  async getPackument (dependency) {
    await this.loadNpmConfigP

    // fullMetadata is required in order to get publish timestamps
    return pacote.packument(dependency, {
      ...this.config,
      fullMetadata: true
    })
  }
}

export class SubstituteRegistry {
  async getPackument (dependency) {
    try {
      const file = new URL(`tests/fixtures/${dependency}-packument.json`, import.meta.url)
      const data = await fs.readFile(file, 'utf8')
      return JSON.parse(data)
    } catch (e) {
      const error = new Error(`SubstituteRegistry: getPackument: unexpected package name "${dependency}"`)
      error.statusCode = 404 // like npm
      throw error
    }
  }
}
