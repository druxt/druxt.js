/**
 * Pins the workspace to the lowest Nuxt the packages declare, for the
 * `test:nuxt-floor` CI job, so the floor in their ranges stays true.
 *
 * The floor is read from `@druxt/core`'s `@nuxt/kit` range, such as `^4.4.4`.
 * `nuxt`, `@nuxt/kit`, `@nuxt/schema` and `@nuxt/vite-builder` resolve to it,
 * and `vite` to the range that `@nuxt/vite-builder` asks for at that version,
 * since a Nuxt minor can need another vite major than the workspace's own.
 * The root `package.json` is rewritten in place: run it in CI, or in a scratch
 * checkout, then `yarn install` and `yarn dedupe`. Never commit the result.
 *
 * With `--check`, after the install, it rewrites nothing and fails unless
 * `nuxt`, `@nuxt/kit` and `@nuxt/schema` are installed at exactly the floor.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const core = JSON.parse(fs.readFileSync('packages/core/package.json', 'utf8'))
const range = core.dependencies?.['@nuxt/kit']
const floor = /^\^(\d+\.\d+\.\d+)$/.exec(range || '')?.[1]
if (!floor) throw new Error(`@druxt/core's @nuxt/kit range is not a caret range: ${range}`)

if (process.argv.includes('--check')) {
  // The hoisted copy each workspace package resolves, read from disk: none of the three needs to export package.json.
  const versions = ['nuxt', '@nuxt/kit', '@nuxt/schema'].map((name) => [name, JSON.parse(fs.readFileSync(`node_modules/${name}/package.json`, 'utf8')).version])
  const wrong = versions.filter(([, version]) => version !== floor)
  console.log(`nuxt-floor: ${versions.map(([name, version]) => `${name} ${version}`).join(', ')}`)
  if (wrong.length) {
    console.error(`nuxt-floor: expected ${floor}, got ${wrong.map(([name, version]) => `${name} ${version}`).join(', ')}`)
    process.exit(1)
  }
  process.exit(0)
}

const info = JSON.parse(execFileSync('yarn', ['npm', 'info', `@nuxt/vite-builder@${floor}`, '--fields', 'dependencies', '--json'], { encoding: 'utf8' }))
const vite = info.dependencies?.vite
if (!vite) throw new Error(`@nuxt/vite-builder@${floor} names no vite range.`)

const root = JSON.parse(fs.readFileSync('package.json', 'utf8'))
root.resolutions = { ...root.resolutions, 'nuxt': floor, '@nuxt/kit': floor, '@nuxt/schema': floor, '@nuxt/vite-builder': floor, vite }
fs.writeFileSync('package.json', `${JSON.stringify(root, null, 2)}\n`)
console.log(`nuxt-floor: nuxt, @nuxt/kit, @nuxt/schema and @nuxt/vite-builder at ${floor}, vite at ${vite}`)
