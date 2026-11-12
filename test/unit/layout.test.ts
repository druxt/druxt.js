import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** Compat's copy of the 1.x sources, kept as 1.x laid them out. */
const SKIPPED = ['packages/compat/src/legacy/']

/**
 * Files outside the skipped folders.
 *
 * @param files - Absolute paths.
 */
const outsideSkipped = (files: string[]): string[] => files.filter((file) => !SKIPPED.some((skipped) => file.startsWith(join(root, skipped))))

/** Every file below a directory, as absolute paths. */
const filesBelow = (dir: string): string[] => existsSync(dir)
  ? readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
  : []

/** The file a relative specifier names, tried as written, with an extension and as a folder index. */
const resolveSpecifier = (from: string, specifier: string, files: Set<string>): string | undefined => {
  const base = resolve(from, specifier)
  return [base, `${base}.ts`, `${base}.vue`, join(base, 'index.ts')].find((candidate) => files.has(candidate))
}

/**
 * The relative specifiers a source re-exports that make a file public: `export * from`, `export { ... } from` with
 * at least one name that is not a type, and any re-export of a `types.ts`. A type-only re-export of another file
 * does not make it public; its type belongs in the package's `types.ts`.
 */
const publicReExports = (source: string): string[] =>
  [...source.matchAll(/\bexport\s+(type\s+)?(\*(?:\s+as\s+\w+)?|\{([^}]*)\})\s*from\s*['"](\.[^'"]*)['"]/g)]
    .filter(([, type, all, names, specifier]) => /(?:^|\/)types(?:\.ts)?$/.test(specifier!)
      || (!type && (all!.startsWith('*') || names!.split(',').some((name) => name.trim() && !/^type\s/.test(name.trim())))))
    .map((match) => match[4]!)

/**
 * The `./` paths a `module.ts` hands to Nuxt, Nitro or Vite: every quoted relative path outside an import or
 * re-export statement. A template literal stands for every file below the folder its fixed part names.
 */
const registeredPaths = (source: string): { files: string[], folders: string[] } => {
  const code = source.replace(/^\s*(?:import(?!\s*\()|export\s+(?:type\s+)?[*{])[^;]*?\bfrom\s*['"][^'"]*['"]/gm, '')
  const files: string[] = []
  const folders: string[] = []
  for (const [, , path] of code.matchAll(/(['`])(\.\/[^'`]*)\1/g)) {
    const dynamic = path!.indexOf('${')
    if (dynamic === -1) files.push(path!)
    else folders.push(path!.slice(0, path!.lastIndexOf('/', dynamic) + 1))
  }
  return { files, folders }
}

/** The entry points a package declares: its exports map's sources and its extra build entries. */
const entries = (pkg: string): string[] => {
  const json = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')) as { exports?: Record<string, { source?: string }> }
  const sources = Object.values(json.exports || {}).flatMap((target) => target.source ? [target.source] : [])
  const build = join(pkg, 'build.config.ts')
  const built = existsSync(build) ? [...readFileSync(build, 'utf8').matchAll(/['"](src\/[^'"]+)['"]/g)].map((match) => `./${match[1]}`) : []
  return [...sources, ...built]
}

interface Layout { files: string[], public: string[], internal: string[], unresolved: string[] }

/** A package's source files, split into what a consumer can reach and what only the package imports. */
const layout = (name: string): Layout => {
  const pkg = join(root, 'packages', name)
  const src = join(pkg, 'src')
  const files = outsideSkipped(filesBelow(src))
  const known = new Set(files)
  const reached = new Set<string>()
  const queue: string[] = []
  const reach = (file: string | undefined) => {
    if (file && !reached.has(file)) {
      reached.add(file)
      queue.push(file)
    }
  }

  const unresolved: string[] = []
  for (const entry of entries(pkg)) {
    const file = resolveSpecifier(pkg, entry, known)
    if (!file) unresolved.push(entry)
    reach(file)
  }
  const module = join(src, 'module.ts')
  if (known.has(module)) {
    const registered = registeredPaths(readFileSync(module, 'utf8'))
    for (const path of registered.files) reach(resolveSpecifier(src, path, known))
    for (const folder of registered.folders) {
      const dir = resolve(src, folder)
      for (const file of files) if (file.startsWith(`${dir}/`)) reach(file)
    }
  }
  while (queue.length) {
    const file = queue.shift()!
    if (!/\.(?:ts|vue)$/.test(file)) continue
    for (const specifier of publicReExports(readFileSync(file, 'utf8'))) reach(resolveSpecifier(dirname(file), specifier, known))
  }

  const rel = (file: string) => relative(src, file)
  return {
    files: files.map(rel).sort(),
    public: [...reached].map(rel).sort(),
    internal: files.filter((file) => !reached.has(file)).map(rel).sort(),
    unresolved,
  }
}

/** Whether a source path sits in a `utils/` folder. */
const inUtils = (path: string) => /(?:^|\/)utils\//.test(path)

/**
 * Whether a package's sources, as absolute paths, are ported to TypeScript: a 1.x package still holds `.js` sources
 * outside the skipped folders.
 *
 * @param files - Every file below the package's `src/`.
 */
const isPorted = (files: string[]): boolean => {
  const kept = outsideSkipped(files)
  return kept.length > 0 && !kept.some((file) => file.endsWith('.js'))
}

/** The packages ported to TypeScript. */
const ported = readdirSync(join(root, 'packages'))
  .filter((name) => statSync(join(root, 'packages', name)).isDirectory())
  .filter((name) => isPorted(filesBelow(join(root, 'packages', name, 'src'))))
  .sort()

describe('package layout', () => {
  it('reads the ported packages', () => {
    expect(ported.length).toBeGreaterThan(0)
  })

  for (const name of ported) {
    describe(`@druxt/${name}`, () => {
      const { public: reachable, internal, unresolved } = layout(name)

      it('reaches its entry points', () => {
        expect(unresolved).toEqual([])
        expect(reachable.length).toBeGreaterThan(0)
      })

      it('keeps nothing a consumer can reach in a utils/ folder', () => {
        expect(reachable.filter(inUtils)).toEqual([])
      })

      it('keeps everything only the package imports in a utils/ folder', () => {
        expect(internal.filter((path) => !inUtils(path))).toEqual([])
      })
    })
  }
})

describe('layout reading', () => {
  it('reads a package whose .js sources sit only in a skipped folder as ported', () => {
    const compat = join(root, 'packages/compat/src')
    expect(isPorted([join(compat, 'module.ts'), join(compat, 'legacy/druxt.js')])).toBe(true)
    expect(isPorted([join(compat, 'legacy/druxt.js')])).toBe(false)
    expect(isPorted([join(compat, 'module.ts'), join(compat, 'other/druxt.js')])).toBe(false)
  })

  it('follows a value re-export and skips a type-only one', () => {
    expect(publicReExports("export * from './a'\nexport { b, type C } from './b'\nexport type { D } from './d'\nexport { type E } from './e'\nexport type * from './f'")).toEqual(['./a', './b'])
  })

  it('follows a type-only re-export of a types.ts', () => {
    expect(publicReExports("export type * from './types'\nexport type { A } from '../types'\nexport type { B } from './types/b'")).toEqual(['./types', '../types'])
  })

  it('reads a registered path and leaves an import out', () => {
    const source = "import { a } from './utils/a'\nexport type { B } from './b'\naddPlugin(resolve('./runtime/plugins/x'))\naddComponent({ filePath: resolve(`./runtime/components/${name}`) })"
    expect(registeredPaths(source)).toEqual({ files: ['./runtime/plugins/x'], folders: ['./runtime/components/'] })
  })
})
