/**
 * Jest config for the druxt-inspect CLI.
 *
 * Runs against recorded JSON:API fixtures (test/adapter.js) - no backend
 * required. This config is deliberately separate from the repo root config:
 * the root's testPathIgnorePatterns excludes /examples/, and this suite
 * doesn't need the Vue/esbuild transforms the packages do.
 *
 * Run from the repo root via `yarn test:node-client`, or directly:
 * `cd examples/node-client && yarn test`.
 */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
}
