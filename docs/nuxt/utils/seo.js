/**
 * Per-page SEO head fragments.
 *
 * The site used to run `nuxt-social-meta`, which set one set of Open Graph tags
 * in nuxt.config.js for all 130 routes: every page shared the homepage's title,
 * description and share image, and none declared a canonical URL. That module
 * has been removed and this is now the only place any of it is decided, so the
 * share card and the canonical URL cannot drift apart.
 */

import { SITE_ORIGIN, SITE_NAME, SITE_DESCRIPTION, TITLE_SUFFIX, TWITTER_HANDLE, SECTIONS, canonicalUrl, sectionFor, titleFromPath } from '~/lib/site'

/** Longest description worth emitting. Google truncates around 160 characters. */
const DESCRIPTION_LIMIT = 160

/**
 * Trim a description to a whole word within the limit.
 *
 * @param {string} text - Source text.
 * @returns {string} The trimmed description.
 */
export const clampDescription = (text) => {
  const value = String(text || '').replace(/\s+/g, ' ').trim()
  if (value.length <= DESCRIPTION_LIMIT) return value

  const cut = value.slice(0, DESCRIPTION_LIMIT)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.]$/, '') + '…'
}

/**
 * The description for a page, falling back through progressively less specific
 * sources rather than to an empty string.
 *
 * The generated API pages are the reason for the section fallback: they are
 * jsdoc output with no prose to excerpt, so a page-level description does not
 * exist for most of them. Saying what the section is beats repeating the
 * site-wide blurb on 98 pages.
 *
 * @param {object} context - The page context.
 * @param {string} [context.description] - The document's own description.
 * @param {string} context.path - The route path.
 * @returns {string} A description.
 */
export const descriptionFor = ({ description, path }) => {
  if (description) return clampDescription(description)
  const section = sectionFor(path)
  return clampDescription(section ? SECTIONS[section].description : SITE_DESCRIPTION)
}

/**
 * A complete `head()` fragment for a documentation page.
 *
 * Returns `title`, `meta` and `link`, ready to spread into a page's own
 * `head()`. Every tag is keyed by `hid` so that a page, or a layout, can
 * override one of them by name without emitting a second copy alongside it.
 *
 * @param {object} context - The page context.
 * @param {string} context.title - The document title, without the site suffix.
 * @param {string} [context.description] - The document's own description.
 * @param {string} context.path - The route path.
 * @param {string} [context.image] - Absolute share image URL.
 * @param {string} [context.type] - Open Graph type; 'article' for documents.
 * @returns {object} A vue-meta head fragment.
 */
export const seoHead = ({ title, description, path, image, type }) => {
  const url = canonicalUrl(path)
  // A document with no frontmatter title would otherwise render the site name
  // as its own title, on the page and in the share card alike. The homepage
  // passes none deliberately and is the one page where that is correct.
  const heading = title || (path === '/' ? '' : titleFromPath(path))
  const summary = descriptionFor({ description, path })
  // og:title carries the suffix because it stands alone in a share card, with
  // no browser chrome to say which site it came from. The <title> tag gets the
  // suffix from head.titleTemplate, so passing it here would double it.
  const shareTitle = heading ? heading + TITLE_SUFFIX : SITE_NAME
  const shareImage = image || SITE_ORIGIN + '/og-druxt.png'

  return {
    title: heading || undefined,
    meta: [
      { hid: 'description', name: 'description', content: summary },

      { hid: 'og:type', property: 'og:type', content: type || 'article' },
      { hid: 'og:title', property: 'og:title', content: shareTitle },
      { hid: 'og:description', property: 'og:description', content: summary },
      { hid: 'og:url', property: 'og:url', content: url },
      { hid: 'og:image', property: 'og:image', content: shareImage },
      { hid: 'og:site_name', property: 'og:site_name', content: SITE_NAME },

      // Dimensions let a scraper reserve the right space before fetching the
      // image, and several crawlers will not render a card without them. Ported
      // from nuxt-social-meta's `img_size` when that module was removed; they
      // describe static/og-druxt.png, so they change with `shareImage`.
      { hid: 'og:image:width', property: 'og:image:width', content: '1200' },
      { hid: 'og:image:height', property: 'og:image:height', content: '630' },

      { hid: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
      { hid: 'twitter:site', name: 'twitter:site', content: TWITTER_HANDLE },
      { hid: 'twitter:title', name: 'twitter:title', content: shareTitle },
      { hid: 'twitter:description', name: 'twitter:description', content: summary },
      { hid: 'twitter:image', name: 'twitter:image', content: shareImage },
    ],
    link: [
      // The one tag that makes the trailing-slash and UTM-tagged variants of a
      // URL collapse onto a single indexed page.
      { hid: 'canonical', rel: 'canonical', href: url },
    ],
  }
}
