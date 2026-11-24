// A Drupal whose languages are served under configured URL prefixes, for the
// tests of reading them. The Umami mock serves every language under its
// langcode, English at /en, so it can't show a default language without a
// prefix, or one like /spanish for es.
const mockAxios = require('jest-mock-axios').default

const languageType = 'configurable_language--configurable_language'

/**
 * Answers mockAxios.get as a Drupal with these languages, until `restore()`.
 *
 * @param {object} site - The site.
 * @param {string} site.baseUrl - The Drupal base URL.
 * @param {object} site.prefixes - Each langcode's URL prefix, such as `{ en: '', es: 'spanish' }`. The first is the default language.
 * @param {boolean} [site.decoupled=false] - Whether decoupled settings publishes the prefixes to a visitor.
 * @param {boolean} [site.contentLanguage=true] - Whether Drupal names the language of an answer in `Content-Language`.
 * @param {boolean} [site.multilingual=true] - Whether the language module is installed.
 * @param {boolean} [site.down=false] - Whether nothing answers at the endpoint.
 * @param {object} [site.cachedAs] - Indexes Drupal's Dynamic Page Cache answers with another prefix's links, as it does
 *   for a default language without a prefix, by the prefix asked for: `{ es: '' }` gives `/es/jsonapi` the links of
 *   `/jsonapi`, still in Spanish.
 * @return {object} `urls()`, the paths requested, and `restore()`.
 */
const stubLanguages = ({ baseUrl, prefixes, decoupled = false, contentLanguage = true, multilingual = true, down = false, cachedAs = {} }) => {
  const get = mockAxios.get.getMockImplementation()
  const urls = []
  const langcodes = Object.keys(prefixes)
  const reply = (data, langcode, status = 200) => {
    const headers = langcode && contentLanguage ? { 'content-language': langcode } : {}
    return Promise.resolve({ data, headers, status })
  }
  const index = (asked, langcode) => {
    const prefix = Object.prototype.hasOwnProperty.call(cachedAs, asked) ? cachedAs[asked] : asked
    const at = `${baseUrl}${prefix ? `/${prefix}` : ''}/jsonapi`
    return reply({
      links: {
        self: { href: at },
        ...(multilingual ? { [languageType]: { href: `${at}/configurable_language/configurable_language` } } : {}),
      },
    }, langcode)
  }

  mockAxios.get.mockImplementation((url, config = {}) => {
    const path = `/${String(url).replace(baseUrl, '').replace(/^\/+/, '')}`
    urls.push(path)
    const [pathname] = path.split('?')
    const fail = (status) => {
      if (config.validateStatus && config.validateStatus(status)) return reply({}, undefined, status)
      const err = new Error(`Request failed with status code ${status}`)
      err.response = { status, data: {} }
      return Promise.reject(err)
    }
    if (down) return fail(503)
    // Drupal answers an unprefixed request in the default language, which
    // names its own prefix.
    if (pathname === '/jsonapi') return index(prefixes[langcodes[0]], langcodes[0])
    if (pathname === '/jsonapi/decoupled/settings') {
      if (!decoupled) return fail(404)
      return reply({ data: { attributes: { settings: { 'language.negotiation': { url: { source: 'path_prefix', prefixes } } } } } })
    }
    for (const langcode of langcodes) {
      const prefix = prefixes[langcode]
      const at = prefix ? `/${prefix}` : ''
      if (pathname === `${at}/jsonapi`) return index(prefix, langcode)
      if (pathname === `${at}/jsonapi/configurable_language/configurable_language`) {
        return reply({
          data: [...langcodes, 'und', 'zxx'].map((id) => ({ type: languageType, id, attributes: { drupal_internal__id: id } })),
          links: {},
        }, langcode)
      }
    }
    return fail(404)
  })

  return { urls: () => urls, restore: () => mockAxios.get.mockImplementation(get) }
}

module.exports = { stubLanguages }
