/**
 * Builder for `/sitemap.xml`.
 *
 * The site has never had one. Every URL below the homepage was discoverable
 * only by crawling links, and the generated API reference is the part of the
 * site least likely to be linked from anywhere external.
 *
 * Pure and side-effect free, so it can be unit tested without a build.
 */

const { SITE_ORIGIN, SECTIONS } = require('./site')

/** Homepage settings. It is the only URL that is not a content document. */
const HOME = { priority: 1.0, changefreq: 'weekly' }

/**
 * Escape the five XML predefined entities.
 *
 * URLs here are built from file paths, so an ampersand is unlikely, but a
 * sitemap that is not well-formed XML is rejected wholesale rather than
 * partially, which makes silent breakage expensive.
 *
 * @param {string} value - Raw text.
 * @returns {string} XML-safe text.
 */
const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

/**
 * One `<url>` entry.
 *
 * @param {object} entry - The URL, changefreq and priority.
 * @returns {string} The XML fragment.
 */
// No <lastmod>: file mtimes are checkout time in CI, so every URL would
// claim fresh modification on every build - worse than omitting it.
const urlEntry = (entry) => [
  '  <url>',
  '    <loc>' + escapeXml(entry.loc) + '</loc>',
  '    <changefreq>' + entry.changefreq + '</changefreq>',
  '    <priority>' + entry.priority.toFixed(1) + '</priority>',
  '  </url>',
].join('\n')

/**
 * Render `/sitemap.xml`.
 *
 * Priority is per section rather than per page: the hand-written guide and the
 * module docs are what the site is for, and the generated API reference is
 * reference material that should not outrank them. It is a relative hint
 * between this site's own URLs, not a claim about the site as a whole.
 *
 * @param {Array<object>} docs - Documents from readContent().
 * @param {object} [options] - Overrides, for tests.
 * @param {string} [options.origin] - Absolute origin for URLs.
 * @param {Date} [options.now] - Clock, for deterministic tests.
 * @returns {string} The complete XML document, newline terminated.
 */
const buildSitemap = (docs, options) => {
  const settings = options || {}
  const origin = settings.origin || SITE_ORIGIN
  const now = settings.now || new Date()


  const entries = [{
    loc: origin + '/',
    // last changed in a way a crawler would care about.
    changefreq: HOME.changefreq,
    priority: HOME.priority,
  }]

  docs.forEach((doc) => {
    // The homepage is added above and is not a content document. A root
    // content/README.md would collapse to route '/' and be emitted a second
    // time, giving the sitemap two entries for one URL.
    if (doc.route === '/') return

    const section = SECTIONS[doc.section]
    entries.push({
      loc: origin + doc.route,
      changefreq: section ? section.changefreq : 'monthly',
      priority: section ? section.priority : 0.5,
    })
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(urlEntry),
    '</urlset>',
    '',
  ].join('\n')
}

module.exports = { buildSitemap, escapeXml }
