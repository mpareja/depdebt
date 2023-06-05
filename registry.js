import pacote from 'pacote'
import { promises as fs } from 'fs'

export class Registry {
  async getPackument (dependency) {
    // fullMetadata is required in order to get publish timestamps
    return pacote.packument(dependency, { fullMetadata: true })
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
