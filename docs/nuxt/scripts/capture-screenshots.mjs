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
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    'playwright',
    path.join(process.cwd(), 'node_modules', 'playwright'),
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
    async prepare(page) {
      const filter = page.locator('input[data-drupal-selector="edit-text"]').first()
      if (await filter.count()) {
        await filter.fill('druxt')
        await page.waitForTimeout(600)
      }
      const row = page.locator('text=Access DruxtJS JSON:API resources').first()
      if (await row.count()) await row.scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
    },
    clip: { x: 264, y: 0, width: 1016, height: 640 },
  },
  {
    name: 'backend-jsonapi-settings.png',
    path: '/admin/config/services/jsonapi',
    clip: { x: 264, y: 0, width: 1016, height: 560 },
  },
  {
    name: 'backend-consumers.png',
    path: '/admin/config/services/consumer',
    async prepare(page) {
      // The quickstart registers one callback per candidate dev port; the
      // docs talk about one frontend, so only the :3000 redirect stays.
      await page.evaluate(() => {
        document.querySelectorAll('li').forEach((li) => {
          if (/localhost:300[1-9]\/callback/.test(li.textContent)) li.remove()
        })
      })
    },
    clip: { x: 264, y: 0, width: 1016, height: 520 },
  },
  {
    name: 'backend-scopes.png',
    path: '/admin/config/people/simple_oauth/oauth2_scope',
    clip: { x: 264, y: 0, width: 1016, height: 520 },
  },
]

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
  if (shot.prepare) await shot.prepare(page)
  const file = path.join(OUT, shot.name)
  await page.screenshot({ path: file, clip: shot.clip })
  console.log('captured', shot.name)
  if (existsSync(file)) optimize(file)
}

await browser.close()
console.log('Done. Review the images before committing.')
