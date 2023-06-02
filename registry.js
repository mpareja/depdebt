const fs = require('fs').promises
const pacote = require('pacote')
const path = require('path')

class Registry {
  async getPackument (dependency) {
    return pacote.packument(dependency)
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
