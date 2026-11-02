import mockAxios from 'jest-mock-axios'
import { axiosVerbs, loadPreset } from 'decoupled-drupal-mock/jest'

// The recorded fixtures came from this origin and the tests still name it, so
// the engine answers for the same site rather than a sentinel host.
const baseUrl = 'https://demo-api.druxtjs.org'

// Jest clears the module registry between test files, so this module runs once
// per file and would read the dump each time. The worker outlives the registry,
// so the engine is cached on the worker's global instead: one read per worker
// rather than one per file.
const CACHE = '__druxtMockEngine'
if (!globalThis[CACHE]) {
  globalThis[CACHE] = loadPreset('umami', { baseUrl })
}
const drupal = globalThis[CACHE]

// A write from an earlier file would otherwise still be there, because the
// engine is now shared across the worker's files.
drupal.reset()

const verbs = axiosVerbs(drupal, baseUrl)

// Requests are anonymous unless a test signs in. The recorded fixtures were
// captured with a privileged account and replayed for every request, so the
// write tests passed without ever sending credentials; the engine enforces
// Drupal's permissions, so the account a test needs is now named by the test.
// No account does everything here: umami's author creates content and its
// editor holds the moderation transitions.
let token = null

const withToken = (config = {}) => {
  if (!token || (config.headers || {}).Authorization) {
    return config
  }
  return { ...config, headers: { ...(config.headers || {}), Authorization: `Bearer ${token.access}` } }
}

/** Signs in as a named account from the preset, or signs out when given nothing. */
mockAxios.__signIn = (name) => {
  token = name ? drupal.tokenFor(name) : null
  return token
}

/** The engine itself, for a test that needs to seed or inspect the site. */
mockAxios.__drupal = drupal

// The spies stay spies: the ~60 assertions on calls keep working, and the
// arguments they record are the caller's, not the ones carrying the token.
mockAxios.get = jest.fn((url, config) => verbs.get(url, withToken(config)))
mockAxios.patch = jest.fn((url, data, config) => verbs.patch(url, data, withToken(config)))
mockAxios.post = jest.fn((url, data, config) => verbs.post(url, data, withToken(config)))
mockAxios.delete = jest.fn((url, config) => verbs.delete(url, withToken(config)))

export default mockAxios
