import { PackageAnalyzer } from '../../package-analyzer.js'
import { Registry } from '../../registry.js'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const registry = new Registry()
const analyzer = new PackageAnalyzer(registry)

describe('interactive tests', () => {
  it('recurisve', async () => {
    const fileList = await fs.readdir(__dirname, { recursive: true })
    const packageJsonFiles = fileList
      .filter(file => file.endsWith('package.json'))
      .map(file => resolve(__dirname, file))

    console.log(__dirname)
    console.log(packageJsonFiles)
    console.log(process.cwd())

    const result = await analyzer.anaylzePackages(packageJsonFiles)
    console.log(JSON.stringify(result, null, 2))
  })
})
