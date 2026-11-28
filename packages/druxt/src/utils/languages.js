import consola from 'consola'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

const languageType = 'configurable_language--configurable_language'

// One read per build, by backend and endpoint, as the Druxt and router modules each read the languages. A build is
// known by its Nuxt instance, so a new build reads again.
const builds = new WeakMap()

/**
 * Drupal's languages and the URL prefix Drupal serves each one under, read at build.
 *
 * Drupal keeps the prefixes in `language.negotiation`, which no JSON:API resource holds, so they are read from
 * Drupal's own answers:
 *
 * - An unprefixed request is answered in the default language, which Drupal names in its `Content-Language` header,
 *   and the index's `self` link carries that language's prefix, empty when it has none.
 * - A language's configured prefix comes from decoupled settings, when the Decoupled Settings module publishes
 *   `language.negotiation` to a visitor. That's the one way to read a prefix that is neither the langcode nor the
 *   default language's.
 * - Any other language is asked for under its langcode, and Drupal answers with its index at that prefix when the
 *   langcode is its prefix.
 *
 * A language whose prefix can't be read is taken to be served under its langcode, with a warning, as Druxt assumed
 * for every language before. A Drupal that can't be reached has no languages, with a warning.
 *
 * @example @lang js
 * const languages = await getLanguages(druxt, { endpoint: '/jsonapi' })
 * // [{ langcode: 'en', prefix: '', default: true }, { langcode: 'es', prefix: 'es' }]
 *
 * @param {DruxtClient} druxt - A Druxt client, without the API proxy.
 * @param {object} [options] - The options.
 * @param {string} [options.endpoint=/jsonapi] - The JSON:API endpoint.
 * @param {object} [options.build] - The build reading them, such as a Nuxt module's `this.nuxt`, so its modules share
 *   one read and its warnings show once. Without it, each call reads again.
 *
 * @returns {Promise<object[]>} Each language's `langcode` and `prefix`, and `default` on the default language. Without
 *   `und` and `zxx`.
 */
export const getLanguages = (druxt, { endpoint = '/jsonapi', build } = {}) => {
  if (!build) return readLanguages(druxt, endpoint, new Set())
  if (!builds.has(build)) builds.set(build, { reads: new Map(), warned: new Set() })
  const { reads, warned } = builds.get(build)
  const key = `${druxt.options.baseUrl} ${endpoint}`
  if (!reads.has(key)) {
    const read = readLanguages(druxt, endpoint, warned)
    reads.set(key, read)
    read.catch(() => reads.delete(key))
  }
  return reads.get(key)
}

const readLanguages = async (druxt, endpoint, warned) => {
  const baseUrl = druxt.options.baseUrl
  // Each warning once in a build.
  const warnOnce = (message) => {
    if (warned.has(message)) return
    warned.add(message)
    consola.warn(`[druxt] ${message}`)
  }

  // The language Drupal answers a request at `path` in, the path its index names itself at, and the resource types
  // it lists. Nothing, for a failed request.
  const answer = async (path) => {
    try {
      const response = await druxt.axios.get(path, { validateStatus: () => true })
      if (response.status < 200 || response.status >= 300) return {}
      const links = (response.data || {}).links || {}
      const href = (links.self || {}).href
      return {
        langcode: (response.headers || {})['content-language'] || undefined,
        self: href ? new URL(href, `${baseUrl}/`).pathname.slice(new URL(`${baseUrl}/`).pathname.length - 1) : undefined,
        types: Object.keys(links),
      }
    } catch (err) {
      return {}
    }
  }

  // The prefix of an index at `/<prefix><endpoint>`, or empty at the endpoint itself. Any other path isn't trusted.
  const prefixOf = (self) => {
    if (!self || !self.endsWith(endpoint)) return undefined
    const prefix = self.slice(0, -endpoint.length)
    if (!prefix) return ''
    return /^\/[^/]+$/.test(prefix) ? prefix.slice(1) : undefined
  }

  // Without the language type in its index, the site has one language and no prefixes.
  const unprefixed = await answer(endpoint)
  if (!unprefixed.types) {
    warnOnce(`Drupal's languages couldn't be read from ${baseUrl}${endpoint}, so each langcode is taken to be its URL prefix.`)
    return []
  }
  if (!unprefixed.types.includes(languageType)) return []

  let langcodes
  try {
    const query = new DrupalJsonApiParams().addFields(languageType, ['drupal_internal__id'])
    langcodes = (await druxt.getCollectionAll(languageType, query) || [])
      .map((o) => o.data)
      .flat()
      .map((o) => ((o || {}).attributes || {}).drupal_internal__id)
      .filter((langcode) => langcode && !['und', 'zxx'].includes(langcode))
  } catch (err) {
    warnOnce(`Drupal's languages couldn't be read from ${baseUrl}${endpoint}, so each langcode is taken to be its URL prefix.`)
    return []
  }

  // The prefixes Decoupled Settings publishes, when it does.
  let configured
  try {
    const response = await druxt.axios.get(`${endpoint}/decoupled/settings`, { validateStatus: () => true })
    const settings = response.status === 200 ? ((((response.data || {}).data || {}).attributes || {}).settings || {}) : {}
    const prefixes = ((settings['language.negotiation'] || {}).url || {}).prefixes
    if (prefixes && typeof prefixes === 'object') configured = prefixes
  } catch (err) {
    configured = undefined
  }

  // Whether Drupal answers at the prefix in the language. Drupal names the language of each answer, and an index's
  // own links can't be trusted: with a default language that has no prefix, Drupal's Dynamic Page Cache gives
  // `/es/jsonapi` the links of `/jsonapi`. Without the header, the index's link to itself decides.
  const answersIn = async (prefix, langcode) => {
    const answered = await answer(`/${prefix}${endpoint}`)
    if (answered.langcode) return answered.langcode === langcode
    return prefixOf(answered.self) === prefix
  }

  // The default language has a prefix of its own when Drupal answers there in it, and none otherwise.
  const defaultLangcode = unprefixed.langcode
  const named = prefixOf(unprefixed.self)
  const defaultPrefix = defaultLangcode
    ? (named && await answersIn(named, defaultLangcode) ? named : '')
    : undefined

  const prefixes = await Promise.all(langcodes.map(async (langcode) => {
    if (configured && typeof configured[langcode] === 'string') return configured[langcode]
    if (langcode === defaultLangcode && defaultPrefix !== undefined) return defaultPrefix
    if (await answersIn(langcode, langcode)) return langcode
    warnOnce(`The URL prefix of the language '${langcode}' on ${baseUrl} couldn't be read, so '/${langcode}' is assumed. Set it in the \`prefixes\` option if Drupal serves it under another prefix.`)
    return langcode
  }))

  return langcodes.map((langcode, index) => ({
    langcode,
    prefix: prefixes[index],
    ...(langcode === defaultLangcode ? { default: true } : {}),
  }))
}
