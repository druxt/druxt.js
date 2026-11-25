// This file imports nothing from `#imports`, because the app plugin and the server routes both use it.

/**
 * Whether the session's cookies are `Secure`.
 *
 * They are when the site is https by its `siteUrl`, or the request came over https. A development server on plain
 * http sets no `Secure` cookie, so its cookies still reach it.
 *
 * @param siteUrl - `druxt.siteUrl`, empty when unset.
 * @param protocol - The request's protocol, `https` or `http`.
 *
 * @example @lang ts
 * secureSite('https://www.example.com', 'http') // true
 */
export const secureSite = (siteUrl: string | undefined, protocol: string | undefined): boolean =>
  /^https:/i.test(siteUrl || '') || /^https:?$/i.test(protocol || '')

/**
 * Decodes a cookie's value.
 *
 * The browser writes its own `Cookie` header. So a value Druxt never wrote, such as a bare `%`, is no value, and
 * never an error.
 *
 * @param value - The value as the header carries it.
 * @returns The decoded value, or undefined for one that does not decode.
 *
 * @example @lang ts
 * decodeCookie('a%20b') // 'a b'
 * decodeCookie('100%') // undefined
 */
export const decodeCookie = (value: string): string | undefined => {
  try {
    return decodeURIComponent(value)
  } catch {
    return undefined
  }
}

/**
 * Decodes a cookie's value as Nuxt's `useCookie()` does: to a number, or to the JSON the value was written as.
 *
 * A value that does not decode is undefined here. Nuxt would keep it as it came.
 *
 * @param value - The value as the header carries it.
 *
 * @example @lang ts
 * decodeStoredCookie('1700000000000') // 1700000000000
 */
export const decodeStoredCookie = (value: string | null | undefined): unknown => {
  if (!value) return value
  const text = decodeCookie(value)
  if (text === undefined || text === 'undefined') return undefined
  try {
    const parsed: unknown = JSON.parse(text)
    // A number that JSON cannot hold exactly stays the text it was.
    return typeof parsed === 'number' && String(parsed) !== text ? text : parsed
  } catch {
    return text
  }
}

/**
 * Reads a cookie's value from a `document.cookie` string, decoded.
 *
 * A corrupted session marker then reads as signed out.
 *
 * @param cookies - The cookies, as `document.cookie` gives them.
 * @param key - The cookie's name.
 * @returns The value, or undefined when the cookie is not set or does not decode.
 *
 * @example @lang ts
 * readDocumentCookie('a=1; druxt.auth.session=1700000000000', 'druxt.auth.session') // '1700000000000'
 */
export const readDocumentCookie = (cookies: string, key: string): string | undefined => {
  const entry = cookies.split('; ').find((part) => part.startsWith(`${encodeURIComponent(key)}=`))
  return entry ? decodeCookie(entry.slice(entry.indexOf('=') + 1)) : undefined
}
