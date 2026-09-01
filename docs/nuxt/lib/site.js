/**
 * Site-wide constants and pure URL helpers.
 *
 * CommonJS because nuxt.config.js requires this at build time to generate
 * sitemap.xml, llms.txt and the OG images. Webpack's interop means pages and
 * components can `import` from it just as well, which is the point: the
 * canonical origin and the section descriptions have exactly one definition,
 * rather than one for the build and a second for the runtime `head()`.
 */

/**
 * Canonical origin. Every absolute URL the build emits is built from this.
 *
 * Overridable per build so a preview or tunnel can emit URLs that resolve to
 * itself: share scrapers only fetch absolute URLs, and pointing a preview's
 * og:image at production means testing against files that are not deployed
 * yet. Lagoon previews derive it from their own route automatically;
 * production leaves both unset and keeps the canonical domain.
 */
const SITE_ORIGIN = process.env.SITE_ORIGIN
  || (process.env.LAGOON_ENVIRONMENT_TYPE !== 'production' && process.env.LAGOON_ROUTE)
  || 'https://druxtjs.org'

const SITE_NAME = 'DruxtJS'

/** Matches nuxt.config.js `head.titleTemplate`. */
const TITLE_SUFFIX = ' - DruxtJS'

/** Twitter account credited on share cards, from the removed nuxt-social-meta config. */
const TWITTER_HANDLE = '@DruxtJS'

const SITE_DESCRIPTION
  = 'Druxt is a framework for building fully decoupled Drupal and Nuxt.js applications and sites.'

/**
 * The three documentation sections.
 *
 * `description` is written for a reader deciding whether this section answers
 * their question, so it is reused verbatim by llms.txt and by the section
 * pages' own og:description. `priority` and `changefreq` feed sitemap.xml.
 */
const SECTIONS = {
  guide: {
    label: 'Guide',
    description: 'Installation, configuration, theming and contribution docs, written by hand.',
    priority: 0.8,
    changefreq: 'monthly',
  },
  modules: {
    label: 'Modules',
    description: 'Per-module documentation for the Druxt packages: what each one renders and how to override it.',
    priority: 0.8,
    changefreq: 'monthly',
  },
  api: {
    label: 'API',
    description: 'Component, mixin and store reference generated from the package source by druxt-docgen.',
    priority: 0.4,
    changefreq: 'yearly',
  },
}

/**
 * Trim a path to its canonical form: leading slash, no trailing slash, and
 * `/` preserved for the homepage.
 *
 * Trailing slashes matter here because both forms resolve. Without a single
 * canonical spelling, `/guide/theming` and `/guide/theming/` are two URLs
 * serving one page, which is the duplicate-content case `<link rel=canonical>`
 * exists to collapse.
 *
 * @param {string} path - A route path, with or without a trailing slash.
 * @returns {string} The canonical path.
 */
const normalisePath = (path) => {
  const trimmed = String(path || '/').replace(/\/+$/, '')
  return trimmed.startsWith('/') ? (trimmed || '/') : '/' + trimmed
}

/**
 * Absolute canonical URL for a route path.
 *
 * @param {string} path - A route path.
 * @returns {string} The absolute URL.
 */
const canonicalUrl = (path) => {
  const normalised = normalisePath(path)
  return SITE_ORIGIN + (normalised === '/' ? '/' : normalised)
}

/**
 * The top-level section a path belongs to, or null for the homepage and any
 * route outside the three documentation sections.
 *
 * @param {string} path - A route path.
 * @returns {string|null} The section key.
 */
const sectionFor = (path) => {
  const first = normalisePath(path).split('/').filter(Boolean)[0]
  return first && SECTIONS[first] ? first : null
}

/**
 * Title of last resort, from a path's own last segment.
 *
 * content/modules/entity/deprecations.md has no frontmatter at all, so it has
 * no title to read, and the page currently renders `<title>druxtjs-org</title>`
 * — the npm package name, picked up as the last fallback. Used by the build
 * and by the runtime `head()` alike so the two agree.
 *
 * @param {string} path - A route path.
 * @returns {string} A human-readable title, or an empty string for the root.
 */
const titleFromPath = (path) => {
  const segment = normalisePath(path).split('/').filter(Boolean).pop()
  if (!segment) return ''
  const words = segment.replace(/[-_]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * The generated share card URL for a route, or null where none is generated.
 *
 * Cards exist for every content document, which is exactly the routes inside
 * a live section. The homepage and anything outside a section fall back to
 * the generated site card, og/site.png.
 *
 * @param {string} path - A route path.
 * @returns {string|null} Absolute image URL, or null.
 */
const ogImageUrl = (path) => {
  const normalised = normalisePath(path)
  const section = sectionFor(normalised)
  if (!section) return null
  return SITE_ORIGIN + '/og' + normalised + '.png'
}

module.exports = {
  SITE_ORIGIN,
  SITE_NAME,
  TITLE_SUFFIX,
  SITE_DESCRIPTION,
  TWITTER_HANDLE,
  SECTIONS,
  normalisePath,
  canonicalUrl,
  ogImageUrl,
  sectionFor,
  titleFromPath,
}
