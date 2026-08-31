#!/usr/bin/env node
/**
 * Render the Open Graph cards from a clean Node process.
 *
 * The generate:done hook runs inside Nuxt 2's process, where the `esm`
 * config loader has patched the module system; satori and resvg crash the
 * process when required through it. Spawned bare, they work, so the hook
 * calls this script instead of the library directly.
 *
 * Usage: node scripts/og-render.js <contentDir> <fontsDir> <outDir>
 */

const { readContent } = require('../lib/content-index')
const { renderOgImages } = require('../lib/og-images')

const [contentDir, fontsDir, outDir] = process.argv.slice(2)

renderOgImages(readContent(contentDir), { fontsDir, outDir })
  .then((written) => {
    process.stdout.write(String(written))
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
