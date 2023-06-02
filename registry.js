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
    return this[dependency]()
  }

  async node () {
    const data = await fs.readFile(path.join(__dirname, 'test', 'fixtures', 'node-packument.json'), 'utf8')
    return JSON.parse(data)
  }
}

module.exports = { Registry, SubstituteRegistry }
