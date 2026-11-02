import mockAxios from 'jest-mock-axios'
import { drupal, signIn, verbs, withToken } from '../drupal'

/** Signs in as a named account from the preset, or signs out when given nothing. */
mockAxios.__signIn = signIn

/** The engine itself, for a test that needs to seed or inspect the site. */
mockAxios.__drupal = drupal

// The spies stay spies: the ~60 assertions on calls keep working, and the
// arguments they record are the caller's, not the ones carrying the token.
mockAxios.get = jest.fn((url, config) => verbs.get(url, withToken(config)))
mockAxios.patch = jest.fn((url, data, config) => verbs.patch(url, data, withToken(config)))
mockAxios.post = jest.fn((url, data, config) => verbs.post(url, data, withToken(config)))
mockAxios.delete = jest.fn((url, config) => verbs.delete(url, withToken(config)))

export default mockAxios
