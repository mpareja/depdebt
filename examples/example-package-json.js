import { exampleString } from './example-string.js'

export const examplePackageJson = {}

examplePackageJson.noDeps = (overrides) => {
  return Object.assign({
    name: exampleString(),
    version: '0.15.8',
    description: '',
    main: 'index.js',
    license: 'MIT',
    dependencies: {
    },
    devDependencies: {
    }
  }, overrides)
}
