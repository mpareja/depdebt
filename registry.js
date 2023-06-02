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
    return this[dependency + 'Packument']()
  }

  async nodePackument () {
    const data = await fs.readFile(path.join(__dirname, 'tests', 'fixtures', 'node-packument.json'), 'utf8')
    return JSON.parse(data)
  }
}

module.exports = { Registry, SubstituteRegistry }
