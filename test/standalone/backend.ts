// The engine the whole suite answers from, in a module of its own, as
// decoupled-drupal-mock's docs/test-runners.md describes for Jest. The tests
// and the manual mock of axios both require it from here.
const { readFileSync } = require('fs')
const { resolve } = require('path')
const { gunzipSync } = require('zlib')

const { axiosVerbs, loadPreset } = require('decoupled-drupal-mock/jest')

// The tests name this origin, so the engine answers for it rather than for a
// sentinel host.
const baseUrl = 'https://api.umami.demo.druxtjs.org'

// The preset publishes the stock site, so the two language-routing patches
// Druxt needs come from an overlay this repository carries itself, named by
// path. test/.mock-overlays/README.md says why it is here.
const overlay = resolve(__dirname, '.mock-overlays/language-routing-patches.json.gz')

// The recipes view with its Difficulty field exposed as a filter, four to a
// page, for the views filter tests. test/.mock-overlays/README.md says how it
// was recorded.
const recipesDifficulty = resolve(__dirname, '.mock-overlays/views-recipes-difficulty.json.gz')

// The mock's build records each View's routes without a query, so a filtered
// or paged recipes request has no recording in the overlay itself. The build
// did ask Drupal those queries, and kept its answers in the overlay's oracle,
// so this extension answers them from there: Drupal's own answers, not ones
// written here. Anything else falls through to the mock.
const recipesQueries = new Map(
  JSON.parse(gunzipSync(readFileSync(resolve(__dirname, '.mock-overlays/oracle/views-recipes-difficulty.json.gz'))))
    .filter(({ request }) => /^(\/en)?\/jsonapi\/views\/recipes\/[^/?]+\?/.test(request))
    .map((entry) => [entry.request, entry])
)
const recordedViewsQueries = {
  name: 'recorded-views-queries',
  answer: ({ method, url }, next) => {
    const { pathname, search } = new URL(url, baseUrl)
    const entry = method === 'GET' && recipesQueries.get(`${pathname}${search}`)
    if (!entry) return next()
    // The build writes a placeholder for the site's address, as the mock does
    // for its own recordings.
    const body = JSON.parse(JSON.stringify(entry.body).split('https://drupal.invalid').join(baseUrl))
    return { status: entry.status, headers: entry.headers, body }
  }
}

// Read once per worker, not once per test file. Jest clears the module registry
// between files, so this module runs again for each one; the worker's global
// outlives the registry.
//
// `global`, not `globalThis`, and written out rather than with `||=`. This
// repository's eslint config sets ecmaVersion 2020, so `||=` does not parse,
// and `env: { es6: true }` declares only ES2015 globals, so `globalThis` is
// undeclared. Node 16 runs both; eslint is what refuses them.
if (!global.__decoupledDrupalMock) {
  global.__decoupledDrupalMock = loadPreset('umami', {
    baseUrl,
    extensions: [recordedViewsQueries],
    overlays: [overlay, recipesDifficulty],
  })
}
const drupal = global.__decoupledDrupalMock

const verbs = axiosVerbs(drupal, baseUrl)

// Requests are anonymous unless a test signs in. The engine enforces Drupal's
// permissions, so a test that writes names the account it needs. No single
// account does everything here: umami's author creates content and its editor
// holds the moderation transitions.
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
