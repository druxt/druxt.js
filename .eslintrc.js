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
      // docs/nuxt Cypress specs. `cy` and `Cypress` are injected by the
      // runner and the suite functions come from its bundled Mocha, so none
      // of them are imported. The jest override above does not reach these:
      // its `test/**/*.js` glob is anchored at this config's directory, and
      // jest would not supply `cy` in any case.
      //
      // Scoped to docs/nuxt rather than every Cypress project, because the
      // examples suite declares the same globals inline with a
      // `/* global cy, it */` comment, which this would turn into a
      // no-redeclare error.
      files: ['docs/nuxt/test/cypress/**/*.cy.js'],
      env: { browser: true, mocha: true },
      globals: { cy: 'readonly', Cypress: 'readonly' }
    }
  ]
}
