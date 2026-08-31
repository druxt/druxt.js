/**
 * Render one Open Graph PNG per content page.
 *
 * Runs from the generate:done hook, next to sitemap.xml and llms.txt, against
 * the same readContent() index the pages were generated from. Satori and resvg
 * are devDependencies; nothing here ships to the browser.
 */

const fs = require('fs')
const path = require('path')
const { ogCard } = require('./og-card')

/** Reference kinds, from the route bucket ApiIndex groups by. */
const KINDS = {
  components: 'Component reference',
  mixins: 'Mixin reference',
  stores: 'Vuex store reference',
}

/**
 * The card facts for one content document.
 *
 * @param {object} doc - A readContent() document: { route, title, description, section }.
 * @returns {object} The ogCard() page object.
 */
const pageFromDoc = (doc) => {
  const parts = doc.route.split('/').filter(Boolean)
  const page = {
    title: doc.title,
    section: doc.section,
    path: doc.route,
    index: parts.length === 1,
    description: doc.description || undefined,
  }

  if (doc.section === 'modules' && parts[1]) {
    page.module = parts[1]
    page.pkg = parts[1] === 'druxt' ? 'druxt' : 'druxt-' + parts[1]
  }

  if (doc.section === 'api' && parts[1] === 'packages' && parts[2]) {
    page.pkg = parts[2]
    // The package's own module icon is the identity mark on API pages too.
    page.module = parts[2].replace(/^druxt-/, '')
    const bucket = parts[3]
    // Generated API markdown has no prose worth excerpting; the kind line
    // says what the page is instead.
    page.description = undefined
    page.kind = /changelog/i.test(doc.route) ? 'Release notes' : KINDS[bucket] || 'Reference'
  }

  return page
}

/**
 * The generated image path for a route, relative to the og/ directory.
 *
 * @param {string} route - A content route, e.g. '/modules/entity'.
 * @returns {string} Relative file path, e.g. 'modules/entity.png'.
 */
const ogImageFile = (route) => route.replace(/^\//, '').replace(/\/$/, '') + '.png'

/**
 * Render every card.
 *
 * @param {Array<object>} docs - readContent() documents.
 * @param {object} options - Paths.
 * @param {string} options.fontsDir - Directory holding the four vendored .ttf files.
 * @param {string} options.outDir - Directory to write PNGs into.
 * @returns {Promise<number>} How many cards were written.
 */
const renderOgImages = async (docs, { fontsDir, outDir }) => {
  const satori = require('satori').default || require('satori')
  const { Resvg } = require('@resvg/resvg-js')

  const font = (file) => fs.readFileSync(path.join(fontsDir, file))
  const fonts = [
    { name: 'Source Sans 3', data: font('SourceSans3-SemiBold.ttf'), weight: 600, style: 'normal' },
    { name: 'Source Sans 3', data: font('SourceSans3-Bold.ttf'), weight: 700, style: 'normal' },
    { name: 'IBM Plex Mono', data: font('IBMPlexMono-Medium.ttf'), weight: 500, style: 'normal' },
    { name: 'IBM Plex Mono', data: font('IBMPlexMono-SemiBold.ttf'), weight: 600, style: 'normal' },
  ]

  let written = 0
  for (const doc of docs) {
    const file = path.join(outDir, ogImageFile(doc.route))
    await fs.promises.mkdir(path.dirname(file), { recursive: true })

    const svg = await satori(ogCard(pageFromDoc(doc)), { width: 1200, height: 630, fonts })
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
    await fs.promises.writeFile(file, png)
    written++
  }

  return written
}

module.exports = { renderOgImages, pageFromDoc, ogImageFile }
