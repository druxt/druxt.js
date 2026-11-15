// cspell:ignore cuser fuser jsonapix (encoded paths that try to leave a proxied one)
import { describe, expect, it } from 'vitest'
import { forwardedHeaders, hostname, isDruxtRoute, proxyCookie, proxyLocation, proxyTarget } from '../../packages/core/src/runtime/server/utils/proxy'

describe('proxyTarget()', () => {
  const routes = ['/jsonapi/**', '/english/jsonapi/**', '/oauth/token']

  it('sends a proxied path and its query to the base URL', () => {
    expect(proxyTarget('/jsonapi/node/page?page[limit]=1', 'https://drupal.test/', routes)).toBe('https://drupal.test/jsonapi/node/page?page[limit]=1')
    expect(proxyTarget('/jsonapi', 'https://drupal.test', routes)).toBe('https://drupal.test/jsonapi')
    expect(proxyTarget('/english/jsonapi/node/page', 'https://drupal.test/sub', routes)).toBe('https://drupal.test/sub/english/jsonapi/node/page')
    expect(proxyTarget('/oauth/token', 'https://drupal.test', routes)).toBe('https://drupal.test/oauth/token')
  })

  it('refuses a path outside the routes, however it is written', () => {
    for (const path of ['/en/jsonapi/node/page', '/oauth/token/x', '/jsonapix', '/jsonapi/../user/login', '/jsonapi/%2e%2e/user/login', '/jsonapi/..%2Fuser/login', '/jsonapi/..%5cuser/login']) {
      expect(proxyTarget(path, 'https://drupal.test', routes), path).toBeUndefined()
    }
  })
})

describe('proxyTarget(), for a Drupal at /api', () => {
  const routes = ['/api/**', '/api']

  it('sends Drupal the namespace around Druxt\'s own routes, and none of them, however a path is written', () => {
    expect(proxyTarget('/api/node/article', 'https://drupal.test', routes)).toBe('https://drupal.test/api/node/article')
    expect(proxyTarget('/api/_druxtjs', 'https://drupal.test', routes)).toBe('https://drupal.test/api/_druxtjs')
    for (const path of ['/api/_druxt', '/api/_druxt/auth/token', '/api/_druxt/nothing?x=1', '/api/x/../_druxt/cache/clear', '/api/x/..%2F_druxt/cache/clear']) {
      expect(isDruxtRoute(path), path).toBe(true)
      expect(proxyTarget(path, 'https://drupal.test', routes), path).toBeUndefined()
    }
    expect(isDruxtRoute('/api/node/article')).toBe(false)
  })
})

describe('proxyTarget(), on paths written to escape', () => {
  it('reads a leading // as a path, never a host', () => {
    expect(proxyTarget('//elsewhere.test/jsonapi/node/page', 'https://drupal.test', ['/jsonapi/**'])).toBeUndefined()
    expect(proxyTarget('jsonapi/node/page', 'https://drupal.test', ['/jsonapi/**'])).toBeUndefined()
  })

  it('keeps a double-encoded path below the route, as Drupal decodes it once', () => {
    expect(proxyTarget('/jsonapi/%252e%252e/user/login', 'https://drupal.test', ['/jsonapi/**'])).toBe('https://drupal.test/jsonapi/%252e%252e/user/login')
  })
})

describe('proxyLocation()', () => {
  it('moves a location on the base URL to the same path on the site', () => {
    expect(proxyLocation('https://drupal.test/user/1?check_logged_in=1#top', 'https://drupal.test')).toBe('/user/1?check_logged_in=1#top')
    expect(proxyLocation('https://drupal.test/sub/node/1', 'https://drupal.test/sub/')).toBe('/node/1')
    expect(proxyLocation('//drupal.test/node/1', 'https://drupal.test')).toBe('/node/1')
  })

  it('keeps a moved location on the site, however many slashes its path starts with', () => {
    expect(proxyLocation('http://drupal.test//elsewhere.test/x', 'http://drupal.test')).toBe('/elsewhere.test/x')
    expect(proxyLocation('http://drupal.test/\\elsewhere.test', 'http://drupal.test')).toBe('/elsewhere.test')
    expect(proxyLocation('http://drupal.test/sub//elsewhere.test', 'http://drupal.test/sub')).toBe('/elsewhere.test')
  })

  it('leaves a location elsewhere, or relative, as Drupal sent it', () => {
    for (const location of ['https://elsewhere.test/away', 'https://drupal.test:8443/node/1', 'http://drupal.test/node/1', 'https://drupal.test/other', '/node/1', 'node/1']) {
      expect(proxyLocation(location, location === 'https://drupal.test/other' ? 'https://drupal.test/sub' : 'https://drupal.test'), location).toBe(location)
    }
  })
})

describe('forwardedHeaders()', () => {
  it('drops the browser\'s forwarding headers and sets the site\'s own', () => {
    const headers = forwardedHeaders(
      { 'X-Forwarded-For': '1.2.3.4', 'x-forwarded-host': 'forged.test', 'x-forwarded-proto': 'https', Forwarded: 'for=1.2.3.4', cookie: 'SESS1=abc', skipped: undefined },
      { ip: '10.0.0.1', host: 'site.test', protocol: 'http' },
    )
    expect(headers).toEqual({ cookie: 'SESS1=abc', 'x-forwarded-for': '10.0.0.1', 'x-forwarded-host': 'site.test', 'x-forwarded-proto': 'http' })
  })

  it('drops the other forwarding headers unless the front proxy is trusted', () => {
    const inbound = { 'x-forwarded-port': '443', 'X-Real-IP': '1.2.3.4', 'x-forwarded-server': 'proxy' }
    expect(Object.keys(forwardedHeaders(inbound, { ip: '10.0.0.1', host: 'site.test', protocol: 'http' }))).toEqual(['x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto'])
    expect(forwardedHeaders(inbound, { ip: '10.0.0.1', host: 'site.test', protocol: 'http' }, true)).toMatchObject({ 'x-forwarded-port': '443', 'x-real-ip': '1.2.3.4', 'x-forwarded-server': 'proxy' })
  })

  it('adds the client to a trusted X-Forwarded-For chain', () => {
    const client = { ip: '10.0.0.1', host: 'www.site.test', protocol: 'https' }
    expect(forwardedHeaders({ 'x-forwarded-for': '203.0.113.7, 198.51.100.1' }, client, true)).toEqual({
      'x-forwarded-for': '203.0.113.7, 198.51.100.1, 10.0.0.1', 'x-forwarded-host': 'www.site.test', 'x-forwarded-proto': 'https',
    })
    expect(forwardedHeaders({}, client, true)['x-forwarded-for']).toBe('10.0.0.1')
    expect(forwardedHeaders({ 'x-forwarded-for': '203.0.113.7' }, client)['x-forwarded-for']).toBe('10.0.0.1')
  })

  it('drops the headers the Connection header names, and the hop-by-hop ones, which are for the site alone', () => {
    const client = { ip: '10.0.0.1', host: 'site.test', protocol: 'http' }
    const inbound = { 'X-Private-Hop': 'a', 'x-other': 'b', 'TE': 'trailers', 'trailer': 'Expires', 'proxy-authorization': 'Basic abc', 'proxy-connection': 'keep-alive', 'cookie': 'SESS1=abc' }
    expect(forwardedHeaders(inbound, client, false, 'close, x-private-hop , X-Other')).toEqual({ 'cookie': 'SESS1=abc', 'x-forwarded-for': '10.0.0.1', 'x-forwarded-host': 'site.test', 'x-forwarded-proto': 'http' })
    // With no Connection header, a header no one named passes.
    expect(forwardedHeaders(inbound, client)).toMatchObject({ 'x-private-hop': 'a', 'x-other': 'b' })
    // The headers the proxy sets are its own, whatever Connection names.
    expect(forwardedHeaders({}, client, false, 'x-forwarded-host, x-forwarded-for')).toMatchObject({ 'x-forwarded-for': '10.0.0.1', 'x-forwarded-host': 'site.test' })
  })

  it('sends no X-Forwarded-For without an address', () => {
    expect(forwardedHeaders({ 'x-forwarded-for': '1.2.3.4' }, { host: 'site.test', protocol: 'https' })).not.toHaveProperty('x-forwarded-for')
  })
})

describe('hostname()', () => {
  it('drops the port, keeping an IPv6 address whole', () => {
    expect(hostname('site.test:3000')).toBe('site.test')
    expect(hostname('site.test')).toBe('site.test')
    expect(hostname('[::1]:3000')).toBe('[::1]')
    expect(hostname('[::1]')).toBe('[::1]')
    expect(hostname('::1')).toBe('::1')
  })
})

describe('proxyCookie()', () => {
  it('sets a cookie for Drupal\'s host, in any case and with a leading dot, for the site\'s', () => {
    expect(proxyCookie('s=1; Domain=.Drupal.test; Path=/', 'drupal.test', 'site.test')).toBe('s=1; Domain=site.test; Path=/')
    expect(proxyCookie('s=1; path=/; domain=DRUPAL.TEST', 'drupal.test', 'site.test')).toBe('s=1; path=/; domain=site.test')
  })

  it('leaves a cookie for another domain, or none, as it is', () => {
    expect(proxyCookie('s=1; Domain=.elsewhere.test; Path=/', 'drupal.test', 'site.test')).toBe('s=1; Domain=.elsewhere.test; Path=/')
    expect(proxyCookie('s=1; Domain=sub.drupal.test', 'drupal.test', 'site.test')).toBe('s=1; Domain=sub.drupal.test')
    expect(proxyCookie('s=1; Path=/', 'drupal.test', 'site.test')).toBe('s=1; Path=/')
  })
})
