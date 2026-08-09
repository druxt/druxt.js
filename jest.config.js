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
  modulePathIgnorePatterns: ['/docs', '/examples/'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/docs', '/examples/'],
  transform: {
    '^.+\\.(js)$': 'esbuild-jest',
    '^.+\\.(mjs)$': 'esbuild-jest',
    '^.+\\.(vue)$': 'vue-jest'
  },
  transformIgnorePatterns: ['/node_modules/(?!(druxt))']
}
