import { getMenuLinkUrl, resolveMenuLink } from '../../src/utils/link'

describe('getMenuLinkUrl', () => {
  test.each([
    ['a jsonapi_menu_items url', { url: '/api', link: { uri: 'internal:/api' } }, '/api'],
    ['a jsonapi_menu_items <nolink>', { url: '', route: { name: '<nolink>' } }, ''],
    ['a core resolvable_uri (Drupal 11.4 and later)', { link: { uri: 'entity:node/33', resolvable_uri: '/tutorials' } }, '/tutorials'],
    ['a core <nolink> resolvable_uri', { link: { uri: 'route:<nolink>', resolvable_uri: '' } }, ''],
    ['an entity URI on older cores', { link: { uri: 'entity:node/33' } }, '/node/33'],
    ['an internal URI', { link: { uri: 'internal:/api' } }, '/api'],
    ['a base URI', { link: { uri: 'base:api' } }, '/api'],
    ['a <front> route', { link: { uri: 'route:<front>' } }, '/'],
    ['a <nolink> route', { link: { uri: 'route:<nolink>' } }, ''],
    ['a <none> route', { link: { uri: 'route:<none>' } }, ''],
    ['a <button> route', { link: { uri: 'route:<button>' } }, ''],
    ['a route the frontend cannot resolve', { link: { uri: 'route:user.login' } }, ''],
    ['an external URI', { link: { uri: 'https://github.com/druxt/druxt.js' } }, 'https://github.com/druxt/druxt.js'],
    ['no link', {}, ''],
    ['no attributes', undefined, ''],
  ])('reads %s', (_, attributes, expected) => {
    expect(getMenuLinkUrl(attributes)).toBe(expected)
  })
})

describe('resolveMenuLink', () => {
  const context = {
    baseUrl: 'https://cms.example.com',
    frontendUrl: 'https://www.example.com',
  }

  test.each([
    ['an unrouted internal path', '/api', { to: { path: '/api' } }],
    ['a path with query and hash', '/search?q=menu&tag=a&tag=b#results', { to: { path: '/search', query: { q: 'menu', tag: ['a', 'b'] }, hash: '#results' } }],
    ['an empty URL', '', {}],
    ['a missing URL', undefined, {}],
    ['a Drupal host URL', 'https://cms.example.com/about', { to: { path: '/about' } }],
    ['a frontend host URL', 'https://www.example.com/about?ref=menu', { to: { path: '/about', query: { ref: 'menu' } } }],
    ['a frontend host URL over http', 'http://www.example.com/about', { to: { path: '/about' } }],
    ['a protocol-relative Drupal host URL', '//cms.example.com/about', { to: { path: '/about' } }],
    ['a Drupal public file', 'https://cms.example.com/sites/default/files/guide.pdf', { href: 'https://cms.example.com/sites/default/files/guide.pdf' }],
    ['a Drupal private file', 'https://cms.example.com/system/files/report.pdf', { href: 'https://cms.example.com/system/files/report.pdf' }],
    ['a relative file path', '/sites/default/files/guide.pdf', { href: '/sites/default/files/guide.pdf' }],
    ['an external URL', 'https://github.com/druxt/druxt.js', { href: 'https://github.com/druxt/druxt.js' }],
    ['a host that only starts with the Drupal host', 'https://cms.example.com.test/about', { href: 'https://cms.example.com.test/about' }],
    ['the Drupal hostname on another port', 'https://cms.example.com:8443/about', { href: 'https://cms.example.com:8443/about' }],
    ['a protocol-relative external URL', '//cdn.example.org/app.js', { href: '//cdn.example.org/app.js' }],
    ['a mailto link', 'mailto:hello@example.com', { href: 'mailto:hello@example.com' }],
    ['an unparsable URL', 'https://[invalid/about', { href: 'https://[invalid/about' }],
  ])('resolves %s', (_, url, expected) => {
    expect(resolveMenuLink(url, context)).toStrictEqual(expected)
  })

  test('treats absolute URLs as external when no host is known', () => {
    expect(resolveMenuLink('https://www.example.com/about')).toStrictEqual({ href: 'https://www.example.com/about' })
  })
})
