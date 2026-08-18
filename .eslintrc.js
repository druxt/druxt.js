module.exports = {
  root: true,
  env: { browser: true, es6: true, node: true },
  parserOptions: { ecmaVersion: 2020 },
  extends: [
    'eslint:recommended',
    'plugin:nuxt/recommended',
    'plugin:vue/recommended',
    'plugin:yml/recommended',
    'prettier'
  ],
  plugins: ['jsdoc'],
  rules: {
    'jsdoc/require-returns': 'off',
    'jsdoc/require-param': 'error',
    'jsdoc/check-param-names': 'error',
    'jsdoc/valid-types': 'error',
    'jsdoc/require-param-type': 'error',
    'jsdoc/require-param-description': 'error'
  },
  overrides: [
    {
      files: ['*.test.js', '**/__tests__/**/*.js', 'test/**/*.js'],
      env: { jest: true }
    },
    {
      // Cypress specs, every project (docs/nuxt and the examples suite
      // alike). `cy` and `Cypress` are injected by the runner and the suite
      // functions come from its bundled Mocha, so none of them are imported.
      // The jest override above does not reach these: its `test/**/*.js`
      // glob is anchored at this config's directory, and jest would not
      // supply `cy` in any case. Specs must not re-declare these via
      // `/* global */` comments - that trips no-redeclare.
      files: ['**/cypress/**/*.js'],
      env: { browser: true, mocha: true },
      globals: { cy: 'readonly', Cypress: 'readonly', expect: 'readonly' }
    }
  ]
}
