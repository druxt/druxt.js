module.exports = {
  collectCoverage: true,
  coverageDirectory: './coverage/',
  coveragePathIgnorePatterns: ['/dist/'],
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
