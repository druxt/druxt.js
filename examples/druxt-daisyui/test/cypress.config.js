const { defineConfig } = require("cypress");

module.exports = defineConfig({
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    // Nuxt dev mode compiles the first page on demand; the default 4s
    // element wait expires before hydration finishes on a cold cache.
    defaultCommandTimeout: 30000,
    baseUrl: 'http://localhost:3001',
  },
});
