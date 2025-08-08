import { readFileSync } from 'fs'

export function getVersion () {
  const packagePath = import.meta.dirname + '/package.json'
  const packageRaw = readFileSync(packagePath)
  const packageParsed = JSON.parse(packageRaw)
  return packageParsed.version
}
