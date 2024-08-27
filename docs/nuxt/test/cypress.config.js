const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'w4vd6v',
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
