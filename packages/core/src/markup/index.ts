// @druxt/core/markup: Drupal's filter for the markup a field's settings hold, such as its description.
//
// It is framework free. Nothing here imports Vue, Nuxt or h3, and it needs no DOM, so it runs on the server and in the
// browser alike.

/** The tags Drupal's `FieldFilteredMarkup::allowedTags()` keeps. */
export const FIELD_MARKUP_TAGS: readonly string[] = ['a', 'abbr', 'b', 'big', 'code', 'del', 'em', 'i', 'ins', 'pre', 'q', 'small', 'span', 'strong', 'sub', 'sup', 'tt', 'ol', 'ul', 'li', 'p', 'br', 'img']

/** The attributes kept on an allowed tag. Every other attribute is removed, each `on*` handler included. */
const ATTRIBUTES = new Set(['href', 'title', 'alt', 'src', 'class'])
/** The attributes that hold a URL. One is kept only for an allowed scheme or a relative path. */
const URLS = new Set(['href', 'src'])
/** The schemes a URL may name. */
const SCHEMES = new Set(['http', 'https', 'mailto'])
/** The elements whose content is removed with them, because it is code and not text. */
const DROPPED = new Set(['script', 'style'])
/** The allowed tags, as a set. */
const TAGS = new Set(FIELD_MARKUP_TAGS)

// Whether a character is a letter a tag's name can start with.
const letter = (character: string | undefined): boolean => character !== undefined && ((character >= 'a' && character <= 'z') || (character >= 'A' && character <= 'Z'))

/**
 * Splits markup into its tokens, as Drupal's `Xss::filter()` splits it, each with where it starts. The text between
 * them is not a token.
 *
 * - A comment, up to its `-->` or the end of the markup.
 * - A declaration, up to its `>` or the end of the markup.
 * - A `<` that starts no tag.
 * - A tag, up to its `>` or the end of the markup. Its quoted values are taken whole, so a `>` inside an attribute's
 *   quotes never ends the tag. A quote that never closes takes the rest of the markup, as a browser reads it.
 * - A stray `>`.
 *
 * It reads each character once, so markup built to be slow to read costs no more than its length.
 *
 * @param source - The markup.
 */
const tokens = function* (source: string): Generator<[index: number, token: string]> {
  const end = source.length
  let at = 0
  while (at < end) {
    const character = source[at]
    if (character === '>') {
      yield [at, '>']
      at += 1
      continue
    }
    if (character !== '<') {
      at += 1
      continue
    }
    const start = at
    const next = source[at + 1]
    if (next === '!') {
      const comment = source.startsWith('<!--', at)
      const close = comment ? source.indexOf('-->', at + 4) : source.indexOf('>', at + 2)
      at = close < 0 ? end : close + (comment ? 3 : 1)
      yield [start, source.slice(start, at)]
      continue
    }
    if (!letter(next) && !(next === '/' && letter(source[at + 2]))) {
      // A `<` before anything but a letter or a slash is a token of its own. Any other `<` is text.
      if (next !== undefined && next !== '/') yield [at, '<']
      at += 1
      continue
    }
    at += next === '/' ? 3 : 2
    while (at < end) {
      const inside = source[at]
      if (inside === '>') {
        at += 1
        break
      }
      if (inside === '"' || inside === '\'') {
        const close = source.indexOf(inside, at + 1)
        at = close < 0 ? end : close + 1
      } else {
        at += 1
      }
    }
    yield [start, source.slice(start, at)]
  }
}

// A tag's name, at the start of what follows its `<` or `</`.
const NAME = /^[a-z][a-z\d]*/i

// One attribute of a tag: its name, and its value in double quotes, in single quotes, or bare.
const ATTRIBUTE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

// The named character references that `decode()` reads.
const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', colon: ':', tab: '\t', newline: '\n', sol: '/', lpar: '(', rpar: ')' }

/** Escapes text: each `&` that starts no character reference, and each `<` and `>`. */
const escapeText = (text: string): string => text
  .replace(/&(?![a-zA-Z][a-zA-Z0-9]*;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

/** Escapes an attribute's value for a double-quoted attribute. */
const escapeAttribute = (value: string): string => escapeText(value).replace(/"/g, '&quot;')

/** Decodes a value's character references, enough to read the scheme a browser would read. */
const decode = (value: string): string => value.replace(/&(?:#(\d+)|#x([0-9a-fA-F]+)|([a-zA-Z]+));?/g, (match, dec: string, hex: string, name: string) => {
  if (dec || hex) {
    const code = dec ? Number.parseInt(dec, 10) : Number.parseInt(hex, 16)
    return code > 0 && code <= 0x10FFFF ? String.fromCodePoint(code) : ''
  }
  return NAMED[name.toLowerCase()] ?? match
})

/**
 * Whether a URL is relative to the site, or names an allowed scheme.
 *
 * The URL is read as a browser reads it, without spaces or control characters. A protocol-relative URL, which starts
 * with two slashes or backslashes, names another host. So it is not relative to the site.
 */
const safeUrl = (value: string): boolean => {
  // eslint-disable-next-line no-control-regex
  const plain = decode(value).replace(/[\x00-\x20\x7F-\x9F]/g, '')
  if (/^[/\\]{2}/.test(plain)) return false
  const scheme = /^([^/?#]*?):/.exec(plain)?.[1]
  return scheme === undefined || SCHEMES.has(scheme.toLowerCase())
}

/**
 * Reads the parts of a complete tag token: whether it closes, its name in lower case, and what follows the name.
 *
 * It gives undefined for a token that is not a complete tag.
 */
const readTag = (token: string): { closing: boolean, name: string, body: string } | undefined => {
  if (!token.startsWith('<') || !token.endsWith('>') || token.startsWith('<!')) return undefined
  const closing = token[1] === '/'
  const rest = token.slice(closing ? 2 : 1, -1)
  const name = NAME.exec(rest)?.[0]
  return name ? { closing, name: name.toLowerCase(), body: rest.slice(name.length).replace(/\/$/, '') } : undefined
}

/** Rewrites one allowed tag with its allowed attributes. A closing tag is written with no attributes. */
const filterTag = (name: string, closing: boolean, body: string): string => {
  if (closing) return `</${name}>`
  const kept: string[] = []
  for (const [, attribute, double, single, bare] of body.matchAll(ATTRIBUTE)) {
    const key = attribute!.toLowerCase()
    if (!ATTRIBUTES.has(key)) continue
    const value = double ?? single ?? bare ?? ''
    if (URLS.has(key) && !safeUrl(value)) continue
    kept.push(` ${key}="${escapeAttribute(value)}"`)
  }
  return `<${name}${kept.join('')}>`
}

/**
 * Filters markup as Drupal's `FieldFilteredMarkup` does for a field's description.
 *
 * - It keeps the tags of `FieldFilteredMarkup::allowedTags()`: `a abbr b big code del em i ins pre q small span strong
 *   sub sup tt ol ul li p br img`.
 * - It strips every other tag, and keeps its text. A `<script>` or `<style>` loses its content too.
 * - An allowed tag keeps only `href`, `title`, `alt`, `src` and `class`.
 * - `href` and `src` are kept only for an `http`, `https` or `mailto` URL, or a path relative to the site. A
 *   protocol-relative `//host` URL is never kept.
 * - Comments are removed. Stray `<`, `>` and `&` are escaped.
 *
 * The result is safe to set as `innerHTML`. Tags are not balanced: the browser closes an open one, as it does for
 * Drupal's own output.
 *
 * @param html - The markup, such as a field's description from its schema.
 * @returns The filtered markup.
 *
 * @example @lang js
 * filterFieldMarkup('See <a href="/help" onclick="steal()">help</a><script>steal()</script>.')
 * // 'See <a href="/help">help</a>.'
 */
export function filterFieldMarkup(html: string | null | undefined): string {
  if (!html) return ''
  const source = String(html).replace(/\0/g, '')
  let out = ''
  let last = 0
  // The element whose content is being dropped, until its closing tag.
  let dropping: string | undefined
  for (const [index, token] of tokens(source)) {
    if (!dropping) out += escapeText(source.slice(last, index))
    last = index + token.length
    const tag = readTag(token)
    if (dropping) {
      if (tag?.closing && tag.name === dropping) dropping = undefined
      continue
    }
    if (token === '<') out += '&lt;'
    else if (token === '>') out += '&gt;'
    else if (tag) {
      if (!tag.closing && DROPPED.has(tag.name)) dropping = tag.name
      else if (TAGS.has(tag.name)) out += filterTag(tag.name, tag.closing, tag.body)
    }
    // A comment, a declaration, or a tag left open at the end, is removed.
  }
  if (!dropping) out += escapeText(source.slice(last))
  return out
}
