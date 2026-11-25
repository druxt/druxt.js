import { describe, expect, it } from 'vitest'
import { decodeCookie, decodeStoredCookie, readDocumentCookie } from '../../packages/core/src/runtime/utils/session'

// The app plugin's cookie storage, on the server, reads the request's cookie header with these.
describe('decodeCookie() and decodeStoredCookie()', () => {
  it.each(['%', '%E0%A4%A', '%ED%A0%80'])('take %s for no value', (value) => {
    expect(decodeCookie(value)).toBeUndefined()
    expect(decodeStoredCookie(value)).toBeUndefined()
  })

  it('decode a value as Nuxt\'s useCookie does', () => {
    expect(decodeCookie('a%20b%25')).toBe('a b%')
    expect(decodeStoredCookie('header.payload.signature')).toBe('header.payload.signature')
    expect(decodeStoredCookie('1700000000000')).toBe(1700000000000)
    expect(decodeStoredCookie('%221700000000000%22')).toBe('1700000000000')
    expect(decodeStoredCookie('12345678901234567890')).toBe('12345678901234567890')
    expect(decodeStoredCookie('undefined')).toBeUndefined()
    expect(decodeStoredCookie('')).toBe('')
  })
})

// The browser reads the session's marker from document.cookie on every navigation: a corrupted one is signed out.
describe('readDocumentCookie()', () => {
  it('reads and decodes a cookie by name, and nothing for one not set', () => {
    expect(readDocumentCookie('a=1; druxt.auth.session=1700000000000', 'druxt.auth.session')).toBe('1700000000000')
    expect(readDocumentCookie('a=b%20c', 'a')).toBe('b c')
    expect(readDocumentCookie('a=1', 'druxt.auth.session')).toBeUndefined()
  })

  it.each(['%', '%E0%A4%A', '%ED%A0%80'])('reads a marker of %s, which does not decode, as none', (value) => {
    expect(readDocumentCookie(`a=1; druxt.auth.session=${value}`, 'druxt.auth.session')).toBeUndefined()
  })

  it('reads a cookie by its whole name, never one that only starts with it', () => {
    expect(readDocumentCookie('druxt.auth.sessionX=other; druxt.auth.session=1700000000000', 'druxt.auth.session')).toBe('1700000000000')
    expect(readDocumentCookie('druxt.auth.sessionX=other', 'druxt.auth.session')).toBeUndefined()
  })
})
