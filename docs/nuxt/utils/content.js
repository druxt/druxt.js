/**
 * Helpers for working with @nuxt/content v1 document bodies (a JSON AST).
 */

const isElement = (node, tag) => node && node.type === 'element' && node.tag === tag

/** Depth-first search for the first <img>, returning it and its parent. */
const findImage = (node, parent) => {
  if (isElement(node, 'img')) return { node, parent }
  const children = (node && node.children) || []
  for (const child of children) {
    const found = findImage(child, node)
    if (found) return found
  }
  return null
}

/**
 * Every module README opens with a screenshot of the module in use. Pulled out
 * of the body here so the page can render it as a hero figure rather than an
 * unstyled inline image halfway down the prose.
 *
 * Returns { hero, body } — body is a copy with the image (and its wrapping
 * paragraph, if that is all the paragraph held) removed.
 */
export const extractHero = (document) => {
  const body = document && document.body
  if (!body) return { hero: null, body }

  const found = findImage(body, null)
  if (!found) return { hero: null, body }

  const { node, parent } = found
  const hero = {
    src: node.props.src,
    alt: node.props.alt || '',
  }

  // Only treat it as the hero if it leads the document.
  const first = (body.children || []).find((o) => o.type === 'element')
  const leads = first && (first === parent || first === node
    || (first.children || []).includes(node))
  if (!leads) return { hero: null, body }

  const strip = (n) => ({
    ...n,
    children: (n.children || [])
      .filter((child) => child !== node)
      // Drop the paragraph that only wrapped the hero image, but keep one
      // that also carries its own content. The sibling test counts text as
      // well as elements: markdown puts `![img](x) caption` in a single
      // paragraph whose caption is a text node, and an element-only test
      // discarded that text along with the image.
      .filter((child) => !(
        isElement(child, 'p')
        && (child.children || []).includes(node)
        && !(child.children || []).some((o) => o !== node && (
          (o.type === 'element' && o.tag !== 'img')
          || (o.type === 'text' && (o.value || '').trim())
        ))
      ))
      .map((child) => (child.children ? strip(child) : child)),
  })

  return { hero, body: strip(body) }
}

/** Sections a module README declares, used to build the in-page nav. */
export const sections = (document) => (document.toc || [])
  .filter((o) => o.depth === 2)
  .map((o) => ({ id: o.id, text: o.text }))

/**
 * Where a document sits, for disambiguating a bare title.
 *
 * Several documents legitimately share a title — every module has its own
 * "Deprecations" page, for instance — so a recent-documents list showing
 * only titles renders three identical rows. This returns the path segments
 * above the leaf, title-cased, capped at the last two so it stays short in
 * a 17rem sidebar:
 *
 *   /modules/entity/deprecations -> 'Modules / Entity'
 *   /guide/theming               -> 'Guide'
 *   /api/packages/druxt/client   -> 'Packages / Druxt'
 *
 * Returns '' for a top-level path, where the title is already unambiguous.
 *
 * @param {string} path - The document's route path.
 * @returns {string} A short human-readable location, or an empty string.
 */
export const documentContext = (path) => (path || '')
  .split('/')
  .filter(Boolean)
  .slice(0, -1)
  .slice(-2)
  .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))
  .join(' / ')
