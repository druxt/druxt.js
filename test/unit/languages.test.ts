import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLanguagePrefixes, getLanguages } from '../../packages/core/src/module'
import type { DruxtOptions } from '../../packages/core/src/module'

// The build's warnings, as core logs them.
const warn = vi.hoisted(() => vi.fn())
vi.mock('@nuxt/kit', async (importOriginal) => ({
  ...await importOriginal<Record<string, unknown>>(),
  useLogger: () => ({ warn, info: vi.fn(), error: vi.fn(), success: vi.fn() }),
}))

const type = 'configurable_language--configurable_language'

/** How a stub Drupal departs from a plain one. */
interface StubOptions {
  defaultLangcode?: string
  defaultPrefix?: string
  langcodes?: string[]
  /** The other languages that answer under their langcode. */
  prefixed?: string[]
  contentLanguage?: boolean
  /** Prefixes whose request fails at the network. */
  unreachable?: string[]
  /** Whether the index lists the languages. */
  listed?: boolean
  /** Each language's label, by langcode, when Drupal sends one. */
  labels?: Record<string, string>
  /** `language.negotiation` url.prefixes, published by decoupled_settings to a visitor. */
  decoupled?: Record<string, string>
}

/**
 * A Drupal whose default language is `defaultLangcode`, under `defaultPrefix`, and whose other languages answer under
 * their langcode only when listed in `prefixed`. It issues a token to any client credentials.
 */
const stubDrupal = (base: string, { defaultLangcode = 'en', defaultPrefix = '', langcodes = ['en', 'es', 'und', 'zxx'], prefixed = ['es'], contentLanguage = true, unreachable = [], listed = true, labels = {}, decoupled }: StubOptions = {}) => {
  const fetchMock = vi.fn(async (input: string, _init?: RequestInit) => {
    const url = new URL(input)
    const path = url.pathname.slice(new URL(base).pathname.replace(/\/$/, '').length)
    const reply = (body: unknown, langcode?: string) => new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/vnd.api+json', ...(langcode && contentLanguage ? { 'content-language': langcode } : {}) },
    })
    if (path === '/oauth/token') return reply({ access_token: 'build-token', token_type: 'Bearer', expires_in: 300 })
    if (path === '/jsonapi/decoupled/settings') {
      if (!decoupled) return new Response('{}', { status: 404 })
      return reply({ data: { type: 'decoupled-settings', id: 'decoupled-settings', attributes: { consumer: null, settings: { 'language.negotiation': { url: { source: 'path_prefix', prefixes: decoupled } } } } } })
    }
    const at = defaultPrefix ? `/${defaultPrefix}` : ''
    if (path === '/jsonapi') {
      const links = { self: { href: `${base}${at}/jsonapi` }, ...(listed ? { [type]: { href: `${base}${at}/jsonapi/configurable_language/configurable_language` } } : {}) }
      return reply({ links }, defaultLangcode)
    }
    if (path === `${at}/jsonapi/configurable_language/configurable_language`) {
      return reply({ data: langcodes.map((langcode) => ({ type, id: langcode, attributes: { drupal_internal__id: langcode, ...(labels[langcode] ? { label: labels[langcode] } : {}) } })), links: {} })
    }
    const match = /^\/([^/]+)\/jsonapi$/.exec(path)
    if (match && unreachable.includes(match[1]!)) throw new TypeError('fetch failed')
    if (match && prefixed.includes(match[1]!)) return reply({ links: { self: { href: `${base}${path}` } } }, match[1])
    return new Response('{}', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** The Authorization header each request to `path` carried. */
const authorizations = (fetchMock: ReturnType<typeof stubDrupal>, path: RegExp) => fetchMock.mock.calls
  .filter(([input]) => path.test(new URL(input).pathname))
  .map(([, init]) => (init?.headers as Record<string, string> | undefined)?.Authorization)

const options = (baseUrl: string): DruxtOptions => ({ baseUrl, endpoint: '/jsonapi' })

describe('getLanguages()', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the default language\'s configured prefix, such as english for en', async () => {
    stubDrupal('https://english.test', { defaultPrefix: 'english' })
    expect(await getLanguages(options('https://english.test'))).toEqual([{ langcode: 'en', prefix: 'english', default: true }, { langcode: 'es', prefix: 'es' }])
    expect(await getLanguagePrefixes(options('https://english.test'))).toEqual(['/english', '/es'])
  })

  it('reads a language\'s configured prefix from decoupled settings, such as spanish for es, with no probe', async () => {
    const fetchMock = stubDrupal('https://spanish.test', { prefixed: [], decoupled: { en: '', es: 'spanish' } })
    expect(await getLanguages(options('https://spanish.test'))).toEqual([{ langcode: 'en', prefix: '', default: true }, { langcode: 'es', prefix: 'spanish' }])
    expect(fetchMock.mock.calls.map(([input]) => new URL(input).pathname)).not.toContain('/es/jsonapi')
    expect(warn).not.toHaveBeenCalled()
  })

  it('reads each language\'s label, for a language switcher', async () => {
    stubDrupal('https://labels.test', { labels: { en: 'English', es: 'Spanish' } })
    expect(await getLanguages(options('https://labels.test'))).toEqual([{ langcode: 'en', prefix: '', default: true, label: 'English' }, { langcode: 'es', prefix: 'es', label: 'Spanish' }])
  })

  it('serves a default language with no prefix unprefixed, and leaves it out of the prefixes', async () => {
    stubDrupal('https://unprefixed.test')
    expect(await getLanguages(options('https://unprefixed.test'))).toEqual([{ langcode: 'en', prefix: '', default: true }, { langcode: 'es', prefix: 'es' }])
    expect(await getLanguagePrefixes(options('https://unprefixed.test'))).toEqual(['/es'])
  })

  it('reads the prefix under a base URL with a path', async () => {
    stubDrupal('https://sub.test/drupal', { defaultPrefix: 'english' })
    expect(await getLanguagePrefixes(options('https://sub.test/drupal'))).toEqual(['/english', '/es'])
  })

  it('keeps the langcode as the prefix of a language it cannot read, as 1.x did', async () => {
    stubDrupal('https://unknown.test', { langcodes: ['en', 'es', 'fr'], prefixed: ['es'] })
    expect(await getLanguagePrefixes(options('https://unknown.test'))).toEqual(['/es', '/fr'])
  })

  it('falls back to the langcodes when Drupal names no language', async () => {
    stubDrupal('https://nameless.test', { defaultPrefix: 'english', prefixed: [], contentLanguage: false })
    expect(await getLanguagePrefixes(options('https://nameless.test'))).toEqual(['/en', '/es'])
  })

  it('reads once for a build, whichever options object asks', async () => {
    const fetchMock = stubDrupal('https://once.test')
    await Promise.all([getLanguages(options('https://once.test')), getLanguagePrefixes(options('https://once.test/'))])
    const calls = fetchMock.mock.calls.length
    await getLanguages(options('https://once.test'))
    expect(fetchMock.mock.calls.length).toBe(calls)
  })

  it('asks for the prefixes without credentials, and reads the languages with them', async () => {
    const fetchMock = stubDrupal('https://credentials.test', { defaultPrefix: 'english' })
    const credentialed = { ...options('https://credentials.test'), build: { auth: { clientId: 'build', clientSecret: 'secret' } } }
    expect(await getLanguagePrefixes(credentialed)).toEqual(['/english', '/es'])
    expect(authorizations(fetchMock, /configurable_language$/)).toEqual(['Bearer build-token'])
    expect(authorizations(fetchMock, /^\/(?:es\/)?jsonapi$/).filter(Boolean)).toHaveLength(1)
    // The one credentialed index read is the client's own, for the languages: the probes go without.
    const probes = fetchMock.mock.calls.filter(([input]) => /^\/es\/jsonapi$/.test(new URL(input).pathname))
    expect(probes.map(([, init]) => (init?.headers as Record<string, string>).Authorization)).toEqual([undefined])
  })

  it('trusts the default language\'s index only at one prefix segment or none', async () => {
    stubDrupal('https://deep-self.test', { defaultPrefix: 'a/b' })
    expect(await getLanguagePrefixes(options('https://deep-self.test'))).toEqual(['/en', '/es'])
  })

  it('falls back with a warning, not a failed build, when a probe fails at the network', async () => {
    stubDrupal('https://unreachable.test', { prefixed: [], unreachable: ['es'] })
    expect(await getLanguagePrefixes(options('https://unreachable.test'))).toEqual(['/es'])
    expect(warn).toHaveBeenCalledWith("The URL prefix of the language 'es' on Drupal at https://unreachable.test could not be read, so '/es' is assumed. Requests under its real prefix are neither proxied nor routed.")
  })

  it('reads no languages, with a warning, when an anonymous build is shown none', async () => {
    stubDrupal('https://hidden.test', { langcodes: [] })
    expect(await getLanguages(options('https://hidden.test'))).toEqual([])
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^Drupal at https:\/\/hidden\.test lists languages but shows none to an anonymous build, so no language prefixes are proxied or routed\. Set build credentials/))
  })

  it('reads no languages, and warns nothing, for a site without the language module', async () => {
    warn.mockClear()
    stubDrupal('https://monolingual.test', { listed: false })
    expect(await getLanguages(options('https://monolingual.test'))).toEqual([])
    expect(warn).not.toHaveBeenCalled()
  })

  // One anonymous request answers it: the index lists no language type, so there is no sign-in and no other read.
  it('reads only the anonymous index on a site without the language module, with no sign-in', async () => {
    const fetchMock = stubDrupal('https://monolingual-signed.test', { listed: false })
    const languages = await getLanguages({ ...options('https://monolingual-signed.test'), build: { auth: { clientId: 'build', clientSecret: 'secret' } } })
    expect(languages).toEqual([])
    expect(fetchMock.mock.calls.map(([input]) => new URL(input).pathname)).toEqual(['/jsonapi'])
    expect(authorizations(fetchMock, /^\/jsonapi$/)).toEqual([undefined])
  })

  it('probes the other languages at once', async () => {
    const fetchMock = stubDrupal('https://concurrent.test', { langcodes: ['en', 'es', 'fr', 'de'], prefixed: ['es', 'fr', 'de'] })
    let inFlight = 0
    let most = 0
    vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
      if (!/^\/[a-z]{2}\/jsonapi$/.test(new URL(input).pathname)) return fetchMock(input, init)
      most = Math.max(most, ++inFlight)
      await new Promise((resolve) => setTimeout(resolve, 20))
      inFlight--
      return fetchMock(input, init)
    })
    expect(await getLanguages(options('https://concurrent.test'))).toHaveLength(4)
    expect(most).toBe(3)
  })
})
