import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** The runtime directory of every package present under a root that has one. */
const runtimeDirs = (base: string): string[] => readdirSync(join(base, 'packages'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(base, 'packages', entry.name, 'src/runtime'))
  .filter((dir) => existsSync(dir))

/** Every runtime source file of every package under a root. */
const runtimeFiles = (base = root): string[] => runtimeDirs(base)
  .flatMap((dir) => readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:ts|vue)$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name)))

/**
 * The names a source imports or re-exports from `#imports`. A type-only import or re-export is left out: it
 * leaves nothing in the emitted code.
 */
const fromImports = (source: string): string[] =>
  [...source.matchAll(/\b(?:import|export)\s*\{([^}]*)\}\s*from\s*['"]#imports['"]/g)]
    .flatMap(([, names]) => names!.split(',').map((name) => name.trim().split(/\s+as\s+/)[0]!).filter((name) => name && !/^type\s/.test(name)))

// `$fetch` is a global, not one of `#imports`' exports. Nuxt 4.4's auto-import resolver fails a production client build on it.
const GLOBALS = ['$fetch']

describe('runtime imports', () => {
  // Positive control: the packages are ported one at a time, so the walk is proven on a package of its own.
  it('reads the runtime files of the packages present', () => {
    const control = mkdtempSync(join(tmpdir(), 'druxt-runtime-imports-'))
    try {
      const file = join(control, 'packages/x/src/runtime/composables/a.ts')
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, "import { $fetch } from '#imports'\n")
      mkdirSync(join(control, 'packages/y/src'), { recursive: true })
      expect(runtimeFiles(control)).toEqual([file])
      expect(fromImports(readFileSync(file, 'utf8'))).toEqual(['$fetch'])
    } finally {
      rmSync(control, { recursive: true, force: true })
    }
  })

  it('imports no global from #imports', () => {
    for (const file of runtimeFiles()) {
      const names = fromImports(readFileSync(file, 'utf8'))
      expect(names.filter((name) => GLOBALS.includes(name)), file).toEqual([])
    }
  })

  it('reads the names from an aliased import too', () => {
    expect(fromImports("import { $fetch as get, useRoute } from '#imports'")).toEqual(['$fetch', 'useRoute'])
  })

  it('reads the names a value re-export takes from #imports', () => {
    expect(fromImports("export { $fetch, useRoute as route } from '#imports'")).toEqual(['$fetch', 'useRoute'])
  })

  it('skips a type-only import or re-export', () => {
    expect(fromImports("import type { $fetch } from '#imports'\nexport type { $fetch } from '#imports'")).toEqual([])
    expect(fromImports("export { type $fetch, useRoute } from '#imports'")).toEqual(['useRoute'])
  })
})
