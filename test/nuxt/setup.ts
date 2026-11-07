// The engine's reset, in the file setupFilesAfterEnv names rather than beside
// the engine. Jest refuses a hook from a module first required inside a test,
// and the manual mock of axios is one: the suite requires it from beforeEach,
// after jest.resetModules().
const { drupal, signIn } = require('./drupal')

afterEach(() => {
  signIn(null)
  drupal.reset()
})
