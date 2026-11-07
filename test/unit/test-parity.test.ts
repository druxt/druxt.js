// cspell:ignore parity
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// The 1.x test cases of each ported package, mapped to the 2.x tests that cover them in test/parity/<package>.json.
// A case names the test that covers it, or says why it has none: removed with 1.x's own deprecation, or changed.
// Two shapes: the navigation packages keep a record of `<file>: <case>` to `{ to: '<file>: <title>' }` or
// `{ reason }`, with the case count in CASES; the entity package keeps a `baseline` and a `cases` list, each case
// with its `to` tests, or `removed` or `changed`, and `see` for the tests of a removed case's behaviour.

const root = resolve(__dirname, '../..')
const dir = join(root, 'test/parity')

/** The case titles a test file declares, as written, with escaped quotes read as quotes. */
const sources = new Map<string, string>()
const source = (file: string): string | undefined => {
  if (!sources.has(file)) sources.set(file, existsSync(join(root, file)) ? readFileSync(join(root, file), 'utf8') : '')
  return sources.get(file) || undefined
}
const titles = (file: string): string[] => [...(source(file) || '').matchAll(/\b(?:it|test)(?:\.each\([^)]*\))?\(\s*'((?:\\.|[^'\\])*)'/g)].map((match) => match[1]!.replace(/\\'/g, '\''))

// The 1.x cases of each navigation package's tests, by file, as its last 1.x release had them.
// Empty until the first navigation package is ported; each port adds its own count.
const CASES: Record<string, number> = {}
type Mapping = { to: string } | { reason: string }

// A package mapped here has its mapping file there: with neither yet, this is the file's one case.
it('maps a package only where test/parity/ holds its mapping', () => {
  expect(existsSync(dir) || Object.keys(CASES).length === 0).toBe(true)
})

describe.each(Object.entries(CASES))('test/parity/%s.json', (name, count) => {
  const parity = JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8')) as Record<string, Mapping>

  it('maps every 1.x case, each once', () => {
    expect(Object.keys(parity)).toHaveLength(count)
    for (const key of Object.keys(parity)) expect(key, key).toMatch(/^[\w./-]+\.test\.js: .+/)
  })

  it('gives each case a 2.x test that exists, or a reason', () => {
    for (const [key, mapping] of Object.entries(parity)) {
      if ('reason' in mapping) {
        expect(mapping.reason.length, key).toBeGreaterThan(20)
        continue
      }
      const [file, title] = mapping.to.split(/: (.*)/s) as [string, string]
      expect(titles(file), `${key} -> ${mapping.to}`).toContain(title)
    }
  })
})

interface Covered { file: string, test: string }
interface ParityCase { file: string, name: string, to?: Covered[], removed?: string, changed?: string, see?: Covered[] }
interface ParityFile { baseline: { package: string, version: string, release: string, cases: number }, cases: ParityCase[] }

// test/parity/ arrives with the first port's mapping.
const listed = (existsSync(dir) ? readdirSync(dir) : []).filter((name) => name.endsWith('.json') && !(name.replace(/\.json$/, '') in CASES))

describe.each(listed)('test parity: %s', (name) => {
  const parity = JSON.parse(readFileSync(join(dir, name), 'utf8')) as ParityFile

  it('names the 1.x baseline, a released version, and lists every one of its cases once', () => {
    expect(parity.baseline.package).toMatch(/^druxt/)
    expect(parity.baseline.version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(parity.cases).toHaveLength(parity.baseline.cases)
    const keys = parity.cases.map((item) => `${item.file} > ${item.name}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('maps each case to a 2.x test that exists, or says why it has none', () => {
    for (const item of parity.cases) {
      const label = `${item.file} > ${item.name}`
      if (item.removed || item.changed) expect(String(item.removed || item.changed).length, label).toBeGreaterThan(20)
      if (!item.removed) expect(item.to?.length, `${label} names no test and is not removed`).toBeGreaterThan(0)
      for (const covered of [...(item.to || []), ...(item.see || [])]) {
        const text = source(covered.file)
        expect(text, `${label}: ${covered.file} does not exist`).toBeDefined()
        expect(text!.includes(covered.test), `${label}: ${covered.file} has no test "${covered.test}"`).toBe(true)
      }
    }
  })
})
