/**
 * Builder for `/llms.txt`, the plain-text site index described at
 * https://llmstxt.org: an H1, a blockquote summary, optional orienting prose,
 * then H2 sections of `- [name](url): notes` links.
 *
 * Distinct from sitemap.xml, which is the same URLs with no descriptions. An
 * assistant answering "how do I override a Druxt field component" needs to know
 * which URL covers that; a crawler scheduling a recrawl does not.
 *
 * Pure and side-effect free, so it can be unit tested without a build.
 */

const { SITE_ORIGIN, SITE_NAME, SITE_DESCRIPTION, SECTIONS } = require('./site')

/**
 * UTM params identifying assistant-sourced clicks.
 *
 * The llms.txt convention is not settled, and tagging is the only way to learn
 * whether the file earns its keep rather than guessing later. Per-page
 * `<link rel="canonical">` means the extra params cost nothing in search.
 * Delete this constant and the `withUtm` call if clean cited URLs ever matter
 * more than the measurement.
 */
const UTM = 'utm_source=llms-txt&utm_medium=ai&utm_campaign=syndication'

/**
 * Orienting prose. The section list alone does not explain that Druxt spans two
 * ecosystems, which is the single most useful fact for answering questions
 * about it correctly.
 */
const PREAMBLE = [
  'Druxt connects a Drupal backend to a Nuxt frontend. It spans two ecosystems: Drupal modules (PHP) that expose JSON:API resources, and Nuxt/Vue packages (JavaScript) that render them.',
  '',
  'The Guide is written by hand. The API reference is generated from the package source by druxt-docgen, so it tracks the released code rather than being maintained separately.',
]

/**
 * Append the tracking params to a URL.
 *
 * @param {string} url - An absolute URL with no query string.
 * @returns {string} The URL with tracking params.
 */
const withUtm = (url) => url + '?' + UTM

/**
 * One `- [name](url): notes` list item.
 *
 * @param {string} title - Link text.
 * @param {string} url - Absolute URL.
 * @param {string} notes - Trailing description, omitted when empty.
 * @returns {string} The list item.
 */
const listItem = (title, url, notes) => (
  '- [' + title + '](' + url + ')' + (notes ? ': ' + notes : '')
)

/**
 * Render `/llms.txt`.
 *
 * The guide and module pages are listed in full. The API reference is not: it
 * is 100+ generated pages, one per component or mixin, and listing them all
 * buries what the project actually is under a wall of near-identical entries.
 * The per-package API index URLs go under `## Optional` instead, which is what
 * that section is for in the format.
 *
 * @param {Array<object>} docs - Documents from readContent().
 * @param {object} [options] - Overrides, for tests.
 * @param {string} [options.origin] - Absolute origin for URLs.
 * @returns {string} The complete file contents, newline terminated.
 */
const buildLlmsTxt = (docs, options) => {
  const origin = (options || {}).origin || SITE_ORIGIN
  const url = (route) => withUtm(origin + route)

  const inSection = (section) => docs
    .filter((doc) => doc.section === section)
    .sort((a, b) => (a.weight - b.weight) || a.route.localeCompare(b.route))

  const lines = [
    '# ' + SITE_NAME,
    '',
    '> ' + SITE_DESCRIPTION,
    '',
    ...PREAMBLE,
  ]

  ;['tutorials', 'how-to', 'explanation', 'modules'].forEach((section) => {
    const entries = inSection(section)
    if (!entries.length) return
    lines.push('', '## ' + SECTIONS[section].label, '')
    entries.forEach((doc) => lines.push(listItem(doc.title, url(doc.route), doc.description)))
  })

  // One entry per package rather than per generated page. `content/api` is a
  // docgen build artifact and is absent from a fresh checkout, so this section
  // disappears entirely rather than emitting dead URLs.
  const packages = docs
    .filter((doc) => /^\/api\/packages\/[^/]+$/.test(doc.route))
    .sort((a, b) => a.route.localeCompare(b.route))

  if (packages.length) {
    lines.push('', '## Optional', '')
    lines.push(listItem('API reference', url('/api'), SECTIONS.api.description))
    packages.forEach((doc) => {
      // Labelled from the route, not the document title. docgen titles each
      // package index after the first symbol it happens to document, so
      // /api/packages/blocks is titled "DruxtBlocksModule" and
      // /api/packages/site is titled "DruxtSiteMixin" — names that point at one
      // export rather than the package a reader is looking for.
      const name = doc.route.split('/').pop()
      const label = name.charAt(0).toUpperCase() + name.slice(1)
      lines.push(listItem(
        label + ' API',
        url(doc.route),
        'Generated component, mixin and store reference for the ' + name + ' package.',
      ))
    })
  }

  lines.push('')
  return lines.join('\n')
}

module.exports = { buildLlmsTxt, UTM }
