import { describe, expect, it } from 'vitest'
import { sessionHeaders } from '../../packages/core/src/runtime/server/utils/proxy'

const cookie = 'SESSabc=drupal; druxt.auth.access_token=access-secret; druxt.auth.refresh_token=refresh-secret; druxt.auth.session=123; other=1'

describe('sessionHeaders()', () => {
  it('turns the session\'s cookie into the Authorization header, and sends Drupal none of the session\'s cookies', () => {
    expect(sessionHeaders({ cookie, accept: 'x' }, true)).toEqual({ cookie: 'SESSabc=drupal', accept: 'x', authorization: 'Bearer access-secret' })
  })

  it('keeps an Authorization header the request sent', () => {
    expect(sessionHeaders({ cookie, authorization: 'Basic abc' }, true)).toEqual({ cookie: 'SESSabc=drupal', authorization: 'Basic abc' })
  })

  it('adds no credentials to a request that asks for none, and passes the ask no further', () => {
    expect(sessionHeaders({ cookie, 'x-druxt-auth': 'none' }, true)).toEqual({ cookie: 'SESSabc=drupal' })
  })

  it('adds no Authorization header unless the server holds the session, and drops the session\'s cookies either way', () => {
    expect(sessionHeaders({ cookie }, false)).toEqual({ cookie: 'SESSabc=drupal' })
    expect(sessionHeaders({ cookie: 'druxt.auth.session=on' }, true)).toEqual({})
  })
})

describe('sessionHeaders(), with a token cookie that does not decode', () => {
  // A bare percent sign, a truncated escape, and the escape of a lone surrogate.
  it.each(['%', '%E0%A4%A', '%ED%A0%80'])('sends the request on without a token for %s', (value) => {
    expect(sessionHeaders({ cookie: `druxt.auth.access_token=${value}; SESSabc=drupal`, accept: 'x' }, true)).toEqual({ cookie: 'SESSabc=drupal', accept: 'x' })
  })
})

describe('sessionHeaders(), on the cookies Drupal receives', () => {
  const sent = (header: string, sessionCookie?: string) => sessionHeaders({ cookie: header }, false, sessionCookie).cookie

  it('sends each of Drupal\'s session cookies, http and https, and nothing else', () => {
    const header = 'SESS0123456789abcdef=one; theme=dark; SSESS9876543210abcdef=two; _ga=GA1.1.1'
    expect(sent(header)).toBe('SESS0123456789abcdef=one; SSESS9876543210abcdef=two')
  })

  it('sends no Cookie header when no cookie is Drupal\'s', () => {
    expect(sessionHeaders({ cookie: 'theme=dark; _ga=GA1.1.1', accept: 'x' }, false)).toEqual({ accept: 'x' })
    expect(sessionHeaders({ cookie: '' }, false)).toEqual({})
    expect(sessionHeaders({}, false)).toEqual({})
  })

  it('drops a cookie whose name only contains SESS', () => {
    expect(sent('theSESS0123=a; SESS0123x=b; SESS=c; my_SESS0123=d; SESSION=e')).toBeUndefined()
  })

  it('drops nuxt-auth-utils\' nuxt-session, and every druxt.auth cookie', () => {
    const header = 'nuxt-session=sealed; druxt.auth.access_token=a; druxt.auth.refresh_token=r; druxt.auth.client_id=c; druxt.auth.expires_at=1; druxt.auth.session=1; SESSabc=drupal'
    expect(sent(header)).toBe('SESSabc=drupal')
  })

  it('reads a malformed header without sending anything that is not a session cookie', () => {
    expect(sent(';;  SESSabc=one ;; garbage; =x; SESSdef;SSESS01=two;')).toBe('SESSabc=one; SSESS01=two')
  })

  it('honours the site\'s own session cookie pattern in place of Drupal\'s', () => {
    expect(sent('site_session=one; SESSabc=two; other=1', 'site_session')).toBe('site_session=one')
  })
})
