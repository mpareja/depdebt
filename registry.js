const fs = require('fs').promises
const pacote = require('pacote')
const path = require('path')

class Registry {
  async getPackument (dependency) {
    // fullMetadata is required in order to get publish timestamps
    return pacote.packument(dependency, { fullMetadata: true })
  }
}

class SubstituteRegistry {
  async getPackument (dependency) {
    try {
      const data = await fs.readFile(path.join(__dirname, 'tests', 'fixtures', `${dependency}-packument.json`), 'utf8')
      return JSON.parse(data)
    } catch (e) {
      throw new Error(`SubstituteRegistry: getPackument: unexpected package name "${dependency}"`)
    }
  }
}

module.exports = { Registry, SubstituteRegistry }
