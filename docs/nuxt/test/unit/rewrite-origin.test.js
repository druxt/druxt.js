/**
 * The preview-origin rewrite, which is the only thing pointing a non-production
 * deploy's baked absolute URLs at its own route. Exercised as a shell script
 * against a fixture `dist/`, because that is what runs in the container.
 */

const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const SCRIPT = path.join(__dirname, '../../scripts/rewrite-origin.sh')
const ROUTE = 'https://pr-1.druxtjs-org.au2.amazee.io'

/**
 * A throwaway deploy directory holding one file per shape the generator emits.
 *
 * @returns {string} The fixture's working directory.
 */
const fixture = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rewrite-origin-'))
  const dist = path.join(dir, 'dist')
  fs.mkdirSync(path.join(dist, 'guide'), { recursive: true })

  fs.writeFileSync(path.join(dist, 'index.html'), '<meta property="og:image" content="https://druxtjs.org/og/site.png">')
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), '<loc>https://druxtjs.org/guide</loc>')
  fs.writeFileSync(path.join(dist, 'payload.js'), 'window.__NUXT__={origin:"https://druxtjs.org"}')
  fs.writeFileSync(path.join(dist, 'guide/state.json'), '{"origin":"https://druxtjs.org"}')
  // No extension: an extension allowlist would miss this one.
  fs.writeFileSync(path.join(dist, 'llms'), 'See https://druxtjs.org/guide')
  // A binary that happens to carry the bytes; `grep -I` should skip it.
  fs.writeFileSync(path.join(dist, 'icon.png'), Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01]),
    Buffer.from('https://druxtjs.org'),
  ]))

  return dir
}

/**
 * Run the script in a fixture.
 *
 * @param {string} cwd - The fixture directory.
 * @param {object} env - Environment overrides.
 * @returns {string} Whatever the script printed.
 */
const run = (cwd, env) => execFileSync('sh', [SCRIPT], {
  cwd,
  env: { PATH: process.env.PATH, ...env },
}).toString()

const read = (dir, file) => fs.readFileSync(path.join(dir, 'dist', file), 'utf8')

describe('scripts/rewrite-origin.sh', () => {
  test('points every text file at the environment route', () => {
    const dir = fixture()
    const out = run(dir, { LAGOON_ENVIRONMENT_TYPE: 'development', LAGOON_ROUTE: ROUTE })

    expect(read(dir, 'index.html')).toBe('<meta property="og:image" content="' + ROUTE + '/og/site.png">')
    expect(read(dir, 'sitemap.xml')).toContain(ROUTE + '/guide')
    expect(read(dir, 'payload.js')).toContain(ROUTE)
    expect(read(dir, 'guide/state.json')).toContain(ROUTE)
    expect(read(dir, 'llms')).toContain(ROUTE + '/guide')
    expect(out).toContain(ROUTE)
  })

  test('leaves binaries alone', () => {
    const dir = fixture()
    run(dir, { LAGOON_ENVIRONMENT_TYPE: 'development', LAGOON_ROUTE: ROUTE })

    expect(fs.readFileSync(path.join(dir, 'dist/icon.png')).toString()).toContain('https://druxtjs.org')
  })

  test('production keeps the canonical domain', () => {
    const dir = fixture()
    run(dir, { LAGOON_ENVIRONMENT_TYPE: 'production', LAGOON_ROUTE: ROUTE })

    expect(read(dir, 'index.html')).toContain('https://druxtjs.org/og/site.png')
  })

  test('a route with a trailing slash does not double the separator', () => {
    const dir = fixture()
    run(dir, { LAGOON_ENVIRONMENT_TYPE: 'development', LAGOON_ROUTE: ROUTE + '/' })

    expect(read(dir, 'sitemap.xml')).toContain(ROUTE + '/guide')
    expect(read(dir, 'sitemap.xml')).not.toContain('//guide')
  })

  test('no route means no rewrite', () => {
    const dir = fixture()
    run(dir, { LAGOON_ENVIRONMENT_TYPE: 'development' })

    expect(read(dir, 'index.html')).toContain('https://druxtjs.org/og/site.png')
  })
})
