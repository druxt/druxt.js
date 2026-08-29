module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/*/src/**/*.{js,vue}',
    '!packages/*/src/**/*.d.ts'
  ],
  coverageDirectory: './coverage/',
  // Floor, not a target: set from the measured baseline (measure first,
  // ratchet up later). Raise these as coverage genuinely improves - don't
  // lower them to make a PR pass.
  coverageThreshold: {
    global: {
      statements: 79,
      branches: 62,
      functions: 79,
      lines: 79
    }
  },
  coveragePathIgnorePatterns: [
    '/dist/',
    // CLI bootstrap script: runs top-level code on import (parses
    // process.argv, immediately invokes main()) - not practical to unit
    // test in isolation, same as any bin/ entry point.
    'packages/docgen/src/druxt-docgen/index.js'
  ],
  moduleFileExtensions: ['js', 'json', 'vue'],
  // Anchored to <rootDir>, and pointed at the directories actually worth
  // skipping rather than at '/docs'. The bare pattern was a substring match on
  // the whole absolute path, so any checkout whose own directory contained
  // "docs" excluded the entire repo: in a git worktree at .worktrees/docs-seo
  // this config found 0 of 72 test files and exited 1. It also blocked the
  // docs site's own pure modules from ever being tested.
  modulePathIgnorePatterns: [
    '<rootDir>/docs/nuxt/node_modules/',
    '<rootDir>/docs/nuxt/dist/',
    '<rootDir>/examples/',
  ],
  // `~` is the docs site's own Nuxt alias. Nothing under packages/*/src uses
  // it, so mapping it here cannot shadow a package import.
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/docs/nuxt/$1',
  },
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/docs/nuxt/node_modules/',
    '<rootDir>/docs/nuxt/dist/',
    '<rootDir>/examples/',
  ],
  transform: {
    '^.+\\.(js)$': 'esbuild-jest',
    '^.+\\.(mjs)$': 'esbuild-jest',
    '^.+\\.(vue)$': 'vue-jest'
  },
  transformIgnorePatterns: ['/node_modules/(?!(druxt))']
}
