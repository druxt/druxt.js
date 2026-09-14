const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'w4vd6v',
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    // Nuxt dev mode compiles each page on demand; the default 4s element
    // wait expires before a cold dev-server finishes compiling the route.
    defaultCommandTimeout: 30000,
    baseUrl: 'http://localhost:3000',
  },
});
