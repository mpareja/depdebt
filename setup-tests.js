const testing = require('node:test')

globalThis.afterAll = testing.after
globalThis.afterEach = testing.afterEach
globalThis.beforeAll = testing.before
globalThis.beforeEach = testing.beforeEach
globalThis.describe = testing.describe
globalThis.expect = require('@jest/expect').jestExpect
globalThis.it = testing.it
