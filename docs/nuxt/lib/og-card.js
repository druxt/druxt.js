/**
 * Open Graph card layout, as a Satori element tree.
 *
 * The card is components/app/PageHeader.vue enlarged to 1200x630 and nothing
 * else: same eyebrow row, same bold tracking-tight title, same muted
 * description, same border-b rule, on base-200. One template, one accent;
 * sections differ by icon and label, not colour. Module pages carry their own
 * two-tone module icon from components/app/icon/module/.
 *
 * Satori takes React-shaped objects, not JSX, so this file stays build-free
 * and loads from the generate hook with a plain require. Every colour is a literal from
 * tailwind.config.js.
 */

const INK = '#1f2937' //                base-content
const INK_70 = 'rgba(31,41,55,0.7)' //  base-content/70
const GROUND = '#f4f7fa' //             base-200
const RULE = '#dbe3ec' //               base-300
const PRIMARY_FOCUS = '#036397'
const SECONDARY_FOCUS = '#3b8070'

const SANS = 'Source Sans 3'
const MONO = 'IBM Plex Mono'

/**
 * The section icon geometry, shared with the section icon components the
 * same way the module geometry is below.
 */
const SECTION_ICON_PATHS = require('./icon-paths')

/**
 * The module icon geometry, shared with the icon components so a mark is
 * only ever drawn in one place. pf/sf mirror the theme variables the
 * components render with; here they resolve to literal hexes for Satori.
 */
const MODULE_ICON_PATHS = require('./module-icon-paths')

/** components/app/Logo.vue, verbatim. Two brand chevrons plus the ink one. */
const LOGO_PATHS = [
  ['M139 330l-1-2c-2-4-2-8-1-13H29L189 31l67 121 22-16-67-121c-1-2-9-14-22-14-6 0-15 2-22 15L5 303c-1 3-8 16-2 27 4 6 10 12 24 12h136c-14 0-21-6-24-12z', '#3498DB'],
  ['M447 304L317 70c-2-2-9-15-22-15-6 0-15 3-22 15l-17 28v54l39-67 129 230h-49a23 23 0 0 1-2 14l-1 1c-6 11-21 12-23 12h76c3 0 17-1 24-12 3-5 5-14-2-26z', '#108775'],
  ['M376 330v-1l1-2c1-4 2-8 1-12l-4-12-102-178-15-27h-1l-15 27-102 178-4 12a24 24 0 0 0 2 15c4 6 10 12 24 12h190c3 0 18-1 25-12zM256 152l93 163H163l93-163z', '#2F495E'],
]

/**
 * Eyebrow labels are singular where the page is one of a set; a section's own
 * landing page gets the plural. Labels follow lib/site.js SECTIONS.
 */
const SECTIONS = {
  guide: { label: 'Guide', plural: 'Guide', icon: 'guide', mono: false },
  modules: { label: 'Module', plural: 'Modules', icon: 'modules', mono: false },
  components: { label: 'Component', plural: 'Components', icon: 'components', mono: true },
  api: { label: 'API', plural: 'API', icon: 'api', mono: true },
}

const el = (type, style, children) => ({ type, props: { style, children } })
const row = (style, children) => el('div', { display: 'flex', ...style }, children)

/**
 * A stroke icon as an inline SVG node. Satori needs explicit width/height on
 * the node and drops it silently without them.
 *
 * @param {Array<Array<string>>} paths - [d, tone] pairs; tone 'sf' renders in
 *   secondary-focus, anything else in the given colour.
 * @param {number} size - Rendered size in px.
 * @param {string} color - Stroke for 'pf' paths.
 * @returns {object} Satori svg node.
 */
const icon = (paths, size, color) => ({
  type: 'svg',
  props: {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    children: paths.map((entry) => {
      const [d, tone] = Array.isArray(entry) ? entry : [entry, 'pf']
      return { type: 'path', props: { d, ...(tone === 'sf' ? { stroke: SECONDARY_FOCUS } : {}) } }
    }),
  },
})

const logo = (height) => ({
  type: 'svg',
  props: {
    width: Math.round((452 / 342) * height),
    height,
    viewBox: '0 0 452 342',
    children: LOGO_PATHS.map(([d, fill]) => ({ type: 'path', props: { d, fill } })),
  },
})

/**
 * Package name, set plain in mono after the section label. The module icon
 * carries the visual identity, so the name needs no box of its own.
 * #036397 on #f4f7fa is 5.8:1.
 *
 * @param {string} text - The package name.
 * @returns {object} Satori node.
 */
const pkgName = (text) =>
  el(
    'div',
    {
      display: 'flex',
      fontFamily: MONO,
      fontSize: 24,
      fontWeight: 500,
      color: PRIMARY_FOCUS,
    },
    text
  )

/**
 * Title sizes are fixed per variant rather than measured; Satori has no text
 * measurement. The caps hold the longest real strings in the content tree:
 * 'Getting started with Druxt.js' (29ch) and 'DruxtEntityFormButtons' (22ch).
 *
 * @param {boolean} mono - Symbol titles set in mono.
 * @param {string} text - The title.
 * @returns {object} Style fragment.
 */
const titleStyle = (mono, text) => {
  if (mono) {
    return {
      fontFamily: MONO,
      fontSize: text.length > 26 ? 56 : 68,
      fontWeight: 600,
      lineHeight: 1.08,
      letterSpacing: '-0.03em',
      maxWidth: 1010,
      wordBreak: 'break-word',
    }
  }
  return {
    fontFamily: SANS,
    fontSize: text.length > 38 ? 68 : 82,
    fontWeight: 700,
    lineHeight: 1.05,
    letterSpacing: '-0.025em',
    maxWidth: 1000,
  }
}

/**
 * The card for one page.
 *
 * @param {object} page - The page facts.
 * @param {string} page.title - Frontmatter title, or the symbol name.
 * @param {string} page.section - A SECTIONS key; unknown keys render as guide.
 * @param {boolean} [page.index] - A section landing page; the eyebrow goes plural.
 * @param {string} [page.pkg] - Package name, rendered as the mono pill.
 * @param {string} [page.module] - Module slug; its own icon replaces the section icon.
 * @param {string} [page.kind] - Reference kind; fills the description line on API pages.
 * @param {string} [page.description] - Frontmatter description.
 * @param {string} page.path - Route, rendered bottom-right.
 * @returns {object} Satori element tree, 1200x630.
 */
function ogCard(page) {
  const section = SECTIONS[page.section] || SECTIONS.guide
  const title = String(page.title || 'DruxtJS')
  const moduleIcon = page.module && MODULE_ICON_PATHS[page.module]

  const meta = [
    icon(moduleIcon || SECTION_ICON_PATHS[section.icon], 40, PRIMARY_FOCUS),
    el(
      'div',
      {
        display: 'flex',
        fontFamily: SANS,
        fontSize: 26,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: PRIMARY_FOCUS,
      },
      page.index ? section.plural : section.label
    ),
  ]

  if (page.pkg) {
    meta.push(el('div', { display: 'flex', fontSize: 26, color: INK_70 }, '·'))
    meta.push(pkgName(page.pkg))
  }

  const block = [
    row({ alignItems: 'center', gap: 14, marginBottom: 28 }, meta),
    el('div', { display: 'flex', color: INK, ...titleStyle(section.mono, title) }, title),
  ]

  // API pages carry no frontmatter description, so the kind fills that line.
  const sub = page.description || page.kind
  if (sub) {
    block.push(
      el(
        'div',
        {
          display: 'flex',
          fontFamily: SANS,
          fontSize: 30,
          lineHeight: 1.4,
          color: INK_70,
          marginTop: 22,
          ...(page.description ? { maxWidth: 920 } : {}),
        },
        sub
      )
    )
  }

  return el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      width: 1200,
      height: 630,
      padding: '0 88px',
      background: GROUND,
      fontFamily: SANS,
    },
    [
      row({ flexDirection: 'column', borderBottom: `2px solid ${RULE}`, paddingBottom: 44 }, block),
      row({ alignItems: 'center', justifyContent: 'space-between', paddingTop: 34 }, [
        row({ alignItems: 'center', gap: 16 }, [
          logo(50),
          el('div', { display: 'flex', fontFamily: SANS, fontSize: 24, fontWeight: 600, color: INK }, 'druxtjs.org'),
        ]),
        el('div', { display: 'flex', fontFamily: MONO, fontSize: 22, color: INK_70 }, page.path || '/'),
      ]),
    ]
  )
}

/**
 * The site-wide share card, used as the fallback for every page without a
 * generated card of its own: the brand lockup over a strip of the nine
 * module marks, per the approved share-image board.
 *
 * @returns {object} Satori element tree, 1200x630.
 */
function ogSiteCard() {
  const strip = row(
    { alignItems: 'center', justifyContent: 'center', gap: 40 },
    Object.keys(MODULE_ICON_PATHS).map((slug) => icon(MODULE_ICON_PATHS[slug], 56, PRIMARY_FOCUS))
  )

  return el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 44,
      width: 1200,
      height: 630,
      background: '#ffffff',
      fontFamily: SANS,
    },
    [
      row({ alignItems: 'center', gap: 36 }, [
        logo(196),
        el('div', { display: 'flex', flexDirection: 'column', gap: 8 }, [
          el('div', { display: 'flex', fontSize: 84, fontWeight: 700, letterSpacing: '-0.02em', color: INK }, 'DruxtJS'),
          el('div', { display: 'flex', fontSize: 33, color: INK_70 }, 'The Fully Decoupled Drupal Framework'),
        ]),
      ]),
      strip,
    ]
  )
}

module.exports = { ogCard, ogSiteCard, SECTIONS, SECTION_ICON_PATHS, MODULE_ICON_PATHS, LOGO_PATHS }
