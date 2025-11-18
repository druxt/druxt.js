const { defineConfig } = require('cypress')

module.exports = defineConfig({
  projectId: 'w4vd6v',
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    // eslint-disable-next-line no-unused-vars
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})
