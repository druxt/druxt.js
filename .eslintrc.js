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
    'jsdoc/require-param': 'warn',
    'jsdoc/check-param-names': 'warn',
    'jsdoc/valid-types': 'warn'
  },
  overrides: [
    {
      files: ['*.test.js', '**/__tests__/**/*.js', 'test/**/*.js'],
      env: { jest: true }
    }
  ]
}
