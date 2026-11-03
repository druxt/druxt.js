// The engine the whole suite answers from, in a module of its own, as
// decoupled-drupal-mock's docs/test-runners.md describes for Jest. The tests
// and the manual mock of axios both require it from here.
const { resolve } = require('path')

const { axiosVerbs, loadPreset } = require('decoupled-drupal-mock/jest')

// The recorded fixtures came from this origin and the tests still name it, so
// the engine answers for the same site rather than a sentinel host.
const baseUrl = 'https://demo-api.druxtjs.org'

// The preset publishes the stock site, so the two language-routing patches
// Druxt needs come from an overlay this repository carries itself, named by
// path. test/.mock-overlays/README.md says why it is here.
const overlay = resolve(__dirname, '.mock-overlays/language-routing-patches.json.gz')

// Read once per worker, not once per test file. Jest clears the module registry
// between files, so this module runs again for each one; the worker's global
// outlives the registry.
//
// `global`, not `globalThis`, and written out rather than with `||=`. This
// repository's eslint config sets ecmaVersion 2020, so `||=` does not parse,
// and `env: { es6: true }` declares only ES2015 globals, so `globalThis` is
// undeclared. Node 16 runs both; eslint is what refuses them.
if (!global.__decoupledDrupalMock) {
  global.__decoupledDrupalMock = loadPreset('umami', { baseUrl, overlays: [overlay] })
}
const drupal = global.__decoupledDrupalMock

const verbs = axiosVerbs(drupal, baseUrl)

// Requests are anonymous unless a test signs in. The recorded fixtures were
// captured with a privileged account and replayed for every request, so the
// write tests passed without ever sending credentials. The engine enforces
// Drupal's permissions, so the account a test needs is named by the test. No
// single account does everything here: umami's author creates content and its
// editor holds the moderation transitions.
//
// The name is held, not the token. reset() revokes every token it issued, so a
// token minted once and kept would be answered 401 from the next test onward,
// with an HTML page rather than a JSON:API error document.
let account = null

const signIn = (name) => { account = name || null }

const withToken = (config = {}) => {
  if (!account || (config.headers || {}).Authorization) {
    return config
  }
  const { access } = drupal.tokenFor(account)
  return { ...config, headers: { ...(config.headers || {}), Authorization: `Bearer ${access}` } }
}

module.exports = { baseUrl, drupal, signIn, verbs, withToken }
