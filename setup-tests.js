import testing from 'node:test'
import { jestExpect } from '@jest/expect'

globalThis.afterAll = testing.after
globalThis.afterEach = testing.afterEach
globalThis.beforeAll = testing.before
globalThis.beforeEach = testing.beforeEach
globalThis.describe = testing.describe
globalThis.expect = jestExpect
globalThis.it = testing.it
