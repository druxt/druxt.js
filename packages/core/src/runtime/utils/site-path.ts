/**
 * A path on this site, or the front page for anything else.
 *
 * Anything else includes another site's URL, which a `redirect` query could name. Nuxt refuses to reload on another
 * host. The visitor is signed in by then, and would see the sign-in fail.
 *
 * @param path - Where to go.
 *
 * @example @lang ts
 * sitePath('/account?tab=edits') // '/account?tab=edits'
 * sitePath('//elsewhere.example') // '/'
 */
export const sitePath = (path: string): string => (/^\/(?![/\\])/.test(path) ? path : '/')
