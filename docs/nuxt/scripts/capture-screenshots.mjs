#!/usr/bin/env node
/**
 * Regenerates the documentation screenshots in static/images/.
 *
 * Every image the docs embed is captured here, so a Drupal admin-theme
 * update or a docs redesign never strands a stale screenshot with no way
 * to rebuild it.
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs <one-time-login-url>
 *
 * Prerequisites:
 *   - The quickstart backend running at BACKEND_URL (default
 *     http://127.0.0.1:8888). Get a login URL with `npm run login` in the
 *     quickstart.
 *   - playwright resolvable (`npm i --no-save playwright` here, or a
 *     global install); its Chromium build downloads on first use.
 *   - Optional: pngquant on PATH (or PNGQUANT env pointing at a binary)
 *     for lossy quantization; without it images are captured
 *     unoptimized and the script says so.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
/**
 * playwright is intentionally not a dependency of this package (its
 * browser download has no place in the site build). Resolve it from the
 * usual places, or from PLAYWRIGHT_MODULE.
 */
const resolvePlaywright = () => {
  // npm's global root is not on the require path, so ask npm for it.
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
const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:8888'
const uli = process.argv[2]

if (!uli) {
  console.error('Pass the one-time login URL: node scripts/capture-screenshots.mjs <url>')
  process.exit(1)
}

/**
 * The shot list. Each entry: output name, path, and a prepare step run
 * before capture. Clips frame the content that the referencing docs page
 * talks about.
 */
const SHOTS = [
  {
    name: 'backend-permissions.png',
    path: '/admin/people/permissions',
    // The permissions table, filtered so the Druxt grant is in frame.
    selector: 'table',
    async prepare(page) {
      const filter = page.locator('input[name="text"], input[data-drupal-selector="edit-text"]').first()
      if (await filter.count()) {
        // Typed, not filled: Drupal's permission filter listens on keyup,
        // which a programmatic fill never emits.
        await filter.pressSequentially('druxt', { delay: 30 })
        await page.waitForTimeout(600)
      }
    },
  },
  {
    name: 'backend-jsonapi-settings.png',
    path: '/admin/config/services/jsonapi',
    selector: 'form',
  },
  {
    name: 'backend-consumers.png',
    path: '/admin/config/services/consumer',
    selector: 'table',
    async prepare(page) {
      // The quickstart registers one callback per candidate dev port; the
      // docs talk about one frontend, so only the :3000 redirect stays.
      await page.evaluate(() => {
        document.querySelectorAll('li').forEach((li) => {
          if (/localhost:300[1-9]\/callback/.test(li.textContent)) li.remove()
        })
      })
    },
  },
  {
    name: 'backend-scopes.png',
    path: '/admin/config/people/simple_oauth/oauth2_scope',
    selector: 'main, .layout-container',
  },
]

/**
 * Capture one element plus a uniform margin, instead of a fixed clip: the
 * shot frames the content the docs page talks about, not the admin
 * toolbar and breadcrumbs above it.
 */
const screenshotElement = async (page, selector, file, padding = 32) => {
  await page.evaluate(() => window.scrollTo(0, 0))
  const box = await page.locator(selector).first().boundingBox()
  if (!box) throw new Error(`no visible element for "${selector}"`)
  const x = Math.max(0, box.x - padding)
  const y = Math.max(0, box.y - padding)
  const clip = {
    x,
    y,
    width: box.width + (box.x - x) + padding,
    height: box.height + (box.y - y) + padding,
  }
  const original = page.viewportSize()
  await page.setViewportSize({
    width: Math.max(original.width, Math.ceil(clip.x + clip.width)),
    height: Math.max(original.height, Math.ceil(clip.y + clip.height)),
  })
  await page.screenshot({ path: file, clip })
  await page.setViewportSize(original)
}

const optimize = (file) => {
  const bin = process.env.PNGQUANT || 'pngquant'
  try {
    const before = statSync(file).size
    execFileSync(bin, ['--force', '--skip-if-larger', '--quality', '65-90', '--output', file, file])
    const after = statSync(file).size
    console.log(`  optimized: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`)
  } catch (e) {
    console.warn(`  NOT optimized (${bin} unavailable); install pngquant and re-run`)
  }
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(uli, { waitUntil: 'networkidle' })

for (const shot of SHOTS) {
  await page.goto(BACKEND + shot.path, { waitUntil: 'networkidle' })
  // One-time login links are single-use: a stale link bounces every admin
  // path to the login form, which would be screenshotted without this.
  if (page.url().includes('/user/login')) {
    console.error(`${shot.name}: landed on ${page.url()} - the one-time login URL is stale or already used. Generate a fresh one and re-run.`)
    process.exit(1)
  }
  if (shot.prepare) await shot.prepare(page)
  const file = path.join(OUT, shot.name)
  await screenshotElement(page, shot.selector, file)
  console.log('captured', shot.name)
  if (existsSync(file)) optimize(file)
}

await browser.close()
console.log('Done. Review the images before committing.')
