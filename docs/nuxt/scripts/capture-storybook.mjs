#!/usr/bin/env node
/**
 * Regenerates the Storybook screenshots in static/images/.
 *
 * Prerequisites:
 *   - A Druxt site's Storybook running (default http://localhost:3003).
 *     The documented source is the monorepo's examples/druxt-site:
 *     `BASE_URL=<backend> NODE_OPTIONS=--openssl-legacy-provider yarn storybook`
 *     (the NODE_OPTIONS prefix on Node 17+ only). Use an Umami backend
 *     (docs/drupal, or https://demo-api.druxtjs.org) so the entity story
 *     carries real fields.
 *   - playwright resolvable, as in capture-screenshots.mjs.
 *   - Optional: pngquant on PATH (or PNGQUANT env) for optimization.
 *
 * Usage:
 *   node scripts/capture-storybook.mjs [storybook-url]
 */
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

const resolvePlaywright = () => {
  let globalRoot
  try { globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() } catch (e) { /* optional */ }
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    'playwright',
    path.join(process.cwd(), 'node_modules', 'playwright'),
    globalRoot && path.join(globalRoot, 'playwright'),
  ].filter(Boolean)
  for (const candidate of candidates) {
    try { return require(candidate) } catch (e) { /* next */ }
  }
  console.error('playwright not found: `npm i --no-save playwright`, or set PLAYWRIGHT_MODULE to its path.')
  process.exit(1)
}
const { chromium } = resolvePlaywright()

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'static', 'images')
const URL = process.argv[2] || 'http://localhost:3003'

const optimize = (file) => {
  const pngquant = process.env.PNGQUANT || 'pngquant'
  try {
      execFileSync(pngquant, ['--force', '--skip-if-larger', '--quality', '65-90', '--output', file, file])
    } catch (e) { /* optional */ }
  }

  const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(4000)

  const tree = '#storybook-explorer-tree'
  // The generated inventory, expanded one level.
  for (const label of ['Blocks', 'Entity', 'Menu', 'Views']) {
    try {
      await page.locator(`${tree} [data-nodetype="group"]`, { hasText: label }).first().click()
      await page.waitForTimeout(800)
    } catch (e) {
      console.error(`group not found: ${label} - is the backend serving content?`)
    }
  }
  await page.waitForTimeout(1500)
  let file = path.join(OUT, 'storybook-tree.png')
  await page.screenshot({ path: file })
  optimize(file)
  console.log(`captured ${file}`)

  // One generated entity story with its controls: a recipe's full display,
  // which carries the most fields on an Umami backend.
  for (const label of [/^Node$/, /^Recipe$/]) {
    await page.locator(`${tree} [data-nodetype="group"]`, { hasText: label }).first().click()
    await page.waitForTimeout(900)
  }
  await page.locator(`${tree} [data-nodetype="component"]`, { hasText: 'View displays' }).first().click()
  await page.waitForTimeout(900)
  await page.locator(`${tree} [data-nodetype="story"]`, { hasText: /^full$/ }).first().click()
  // The story auto-selects a real entity uuid; give the fetch time.
  await page.waitForTimeout(8000)
  file = path.join(OUT, 'storybook-entity-story.png')
  await page.screenshot({ path: file })
  optimize(file)
  console.log(`captured ${file}`)

  console.log('Done. Review the images before committing.')
} finally {
  // A failed capture must not leave Chromium holding the process open.
  await browser.close()
}
