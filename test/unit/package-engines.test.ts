import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8')) as { name: string, engines?: { node?: string } }
// The packages published under the @druxt scope, by directory name.
const packages = readdirSync(join(root, 'packages')).filter((name) => {
  const dir = join(root, 'packages', name)
  return statSync(dir).isDirectory() && existsSync(join(dir, 'package.json')) && read(`packages/${name}/package.json`).name.startsWith('@druxt/')
})

// A consumer's package manager warns from each package's own `engines`, never from the repository root's.
describe('the Node versions each package declares', () => {
  it('reads the packages', () => {
    expect(packages.length).toBeGreaterThan(0)
  })

  it.each(packages)('@druxt/%s declares the versions Nuxt 4 runs on', (name) => {
    expect(read(`packages/${name}/package.json`).engines?.node).toBe('^22.19.0 || ^24.11.0 || >=26.0.0')
  })

  // A README's compatibility table names the same floors, as a reader takes the README's word.
  it('names the same versions in every README that has a Node row', () => {
    const rows = packages.flatMap((name) => readFileSync(join(root, 'packages', name, 'README.md'), 'utf8').split('\n').filter((line) => /^\|\s*Node\s*\|/.test(line)))
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.match(/\d+\.\d+/g)).toEqual(['22.19', '24.11'])
      expect(row).toMatch(/\b26\b/)
    }
  })
})
