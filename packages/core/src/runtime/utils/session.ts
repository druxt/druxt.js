// No #imports here: the app plugin and the server routes both use this file.

/**
 * Whether the session's cookies are `Secure`: the site is https by its `siteUrl`, or the request came over https.
 * A development server on plain http sets none, so its cookies still reach it.
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
 * A cookie's value, decoded, or undefined for one that does not decode, such as a bare `%`. The browser writes its own
 * `Cookie` header, so a value Druxt never wrote is no value, and never an error.
 *
 * @param value - The value as the header carries it.
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
 * A cookie's value as Nuxt's `useCookie()` decodes it, a number or the JSON a value was written as, and undefined for
 * one that does not decode, which Nuxt would keep as it came.
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
    // A number JSON cannot hold exactly stays the text it was.
    return typeof parsed === 'number' && String(parsed) !== text ? text : parsed
  } catch {
    return text
  }
}

/**
 * A cookie's value from a `document.cookie` string, decoded, or undefined when the cookie is not set or does not
 * decode, so a corrupted session marker reads as signed out.
 *
 * @param cookies - The cookies, as `document.cookie` gives them.
 * @param key - The cookie's name.
 *
 * @example @lang ts
 * readDocumentCookie('a=1; druxt.auth.session=1700000000000', 'druxt.auth.session') // '1700000000000'
 */
export const readDocumentCookie = (cookies: string, key: string): string | undefined => {
  const entry = cookies.split('; ').find((part) => part.startsWith(`${encodeURIComponent(key)}=`))
  return entry ? decodeCookie(entry.slice(entry.indexOf('=') + 1)) : undefined
}
