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
 * Overridable per build so a local build or tunnel can emit URLs that resolve
 * to itself: share scrapers only fetch absolute URLs, and pointing a preview's
 * og:image at production means testing against files that are not deployed
 * yet. Lagoon routes exist only at runtime, never as build args, so previews
 * cannot resolve their own route here - scripts/start.sh rewrites the baked
 * origin when the container starts instead.
 */
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://druxtjs.org'

const SITE_NAME = 'DruxtJS'

/** Matches nuxt.config.js `head.titleTemplate`. */
const TITLE_SUFFIX = ' - DruxtJS'

/** Twitter account credited on share cards, from the removed nuxt-social-meta config. */
const TWITTER_HANDLE = '@DruxtJS'

const SITE_DESCRIPTION
  = 'Druxt is a framework for building fully decoupled Drupal and Nuxt.js applications and sites.'

/**
 * The documentation sections.
 *
 * `description` is written for a reader deciding whether this section answers
 * their question, so it is reused verbatim by llms.txt and by the section
 * pages' own og:description. `priority` and `changefreq` feed sitemap.xml.
 */
const SECTIONS = {
  tutorials: {
    label: 'Tutorials',
    description: 'Lessons that take you from nothing to a working Druxt site, one step at a time.',
    priority: 0.9,
    changefreq: 'monthly',
  },
  'how-to': {
    label: 'How-to guides',
    description: 'Goal-oriented recipes for theming, proxying, multilingual content and the clients.',
    priority: 0.8,
    changefreq: 'monthly',
  },
  explanation: {
    label: 'Concepts',
    description: 'How Druxt works and why: architecture, routing, the store, schemas and component resolution.',
    priority: 0.7,
    changefreq: 'monthly',
  },
  // Also claimed by route: sectionFor() returns this for the component
  // reference pages the content index files under api.
  components: {
    label: 'Components',
    description: 'Reference for the Druxt Vue components: what each one renders, and the props and slots it takes.',
    priority: 0.5,
    changefreq: 'yearly',
  },
  // Retained for the legacy /guide/* URLs, which redirect to the sections
  // above. Nothing routes here since the Diataxis restructure.
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
  const normalised = normalisePath(path)
  // Component reference pages live under /api/packages/*/components/, but
  // they belong to the Components section - the sidebar, header, breadcrumb
  // and OG cards all claim them for it, and the descriptions here follow.
  if (/^\/api\/packages\/[^/]+\/components(\/|$)/.test(normalised)) return 'components'
  const first = normalised.split('/').filter(Boolean)[0]
  return first && SECTIONS[first] ? first : null
}

/**
 * Title of last resort, from a path's own last segment.
 *
 * content/modules/entity/deprecations.md has no frontmatter at all, so it has
 * no title to read, and the page currently renders `<title>druxtjs-org</title>`
 * - the npm package name, picked up as the last fallback. Used by the build
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

/**
 * The Diataxis bucket a path belongs to, as reported to GA4.
 *
 * The whole point of a Diataxis restructure is the claim that splitting
 * tutorials from how-to guides from reference material serves readers better.
 * Nothing in GA4 can test that claim while every page is just a `pagePath`
 * string: comparing sections means hand-matching path prefixes in every
 * report, and comparing them *over time* means doing it consistently forever.
 * Reported as a dimension instead, "do how-to guides hold readers better than
 * tutorials" becomes one breakdown.
 *
 * `home` is separated from `other` because the homepage is the single busiest
 * page and would otherwise dominate an `other` bucket that is meant to surface
 * strays.
 *
 * The legacy `guide` section is still a SECTIONS key and so reports under its
 * own name rather than falling into `other`. That is deliberate: it measures
 * how much traffic still arrives on pre-restructure URLs, which is the
 * redirect-health signal the restructure needs and cannot get anywhere else.
 *
 * @param {string} path - A route path.
 * @returns {string} `home`, a section key, or `other`.
 */
const docTypeFor = (path) => {
  const first = normalisePath(path).split('/').filter(Boolean)[0]
  if (!first) return 'home'
  // hasOwnProperty, not a truthiness lookup: `SECTIONS['constructor']` resolves
  // up the prototype chain to a truthy value, so `/constructor` - and
  // `/toString`, `/__proto__`, and anything else a scanner probes - would
  // report as its own bucket. `docTypeExpression` uses Object.keys and never
  // had the hole, so this was also a live disagreement between the two.
  return Object.prototype.hasOwnProperty.call(SECTIONS, first) ? first : 'other'
}

/**
 * `docTypeFor` as a self-contained browser expression, for inlining into the
 * GA4 snippet.
 *
 * The snippet is a string in nuxt.config.js and cannot import this module, so
 * the section list is baked in at build time from `SECTIONS` - the one place
 * it is defined - rather than being retyped. `docTypeFor` and this expression
 * are asserted to agree in the unit tests, which is what stops them drifting.
 *
 * It must stay an expression evaluated at call time, not a constant: vue-meta
 * re-executes the whole inline script on every client-side navigation, which
 * is how `gtag('config')` re-fires per page. Reading `location.pathname` at
 * that moment is what makes the dimension follow the reader.
 *
 * @returns {string} A JavaScript expression yielding the doc type.
 */
const docTypeExpression = () => {
  const known = JSON.stringify(Object.keys(SECTIONS))
  return `(function(){var s=(location.pathname.split('/').filter(Boolean)[0]||'');`
    + `return s?(${known}.indexOf(s)>-1?s:'other'):'home'})()`
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
  docTypeFor,
  docTypeExpression,
}
