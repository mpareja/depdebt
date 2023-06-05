import { promises as fs } from 'fs'

export class DirectoryAnalysis {
  async analyzePackages (packageJsonPaths, analyzePackage) {
    for await (const packageJsonPath of packageJsonPaths) {
      const packageLockJsonPath = packageJsonPath.replace(/package\.json$/, 'package-lock.json')
      const [pkg, pkgLock] = await Promise.allSettled([
        fs.readFile(packageJsonPath, 'utf8'),
        fs.readFile(packageLockJsonPath, 'utf8')
      ])

      if (pkg.status === 'rejected') {
        throw pkg.reason
      }
      const packageJson = JSON.parse(pkg.value)

      let packageLockJson = null
      if (pkgLock.status === 'fulfilled') {
        packageLockJson = JSON.parse(pkgLock.value)
      }

      await analyzePackage(packageJsonPath, packageJson, packageLockJson)
    }
  }
}
