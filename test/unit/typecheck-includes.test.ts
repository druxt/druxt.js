import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../', import.meta.url))

/** A tsconfig's `include`, read past the comments on lines of their own. */
const includes = (file: string): string[] => {
  const text = readFileSync(join(root, file), 'utf8').replace(/^\s*\/\/.*$/gm, '')
  return (JSON.parse(text) as { include?: string[] }).include ?? []
}

/** The test globs each vitest project includes, as the config's source names them. */
const projectGlobs = (source: string): string[] => [...source.matchAll(/include: \[([^\]]*)\]/g)]
  .flatMap((match) => [...match[1]!.matchAll(/'([^']+)'/g)].map((glob) => glob[1]!))

/** Whether a tsconfig include pattern compiles every file a test glob matches. */
const covers = (pattern: string, glob: string): boolean => {
  const include = pattern.replace(/^\.\//, '')
  const test = glob.replace(/^\.\//, '')
  if (include.endsWith('/**/*.ts')) return test.startsWith(include.slice(0, -'**/*.ts'.length))
  if (include.endsWith('/*.ts')) {
    const dir = include.slice(0, -'*.ts'.length)
    return test.startsWith(dir) && !test.slice(dir.length).includes('/')
  }
  return include === test
}

describe('the typecheck', () => {
  it('reads a test glob as covered only by an include that compiles its files', () => {
    expect(covers('./test/unit/*.ts', 'test/unit/*.test.ts')).toBe(true)
    expect(covers('./test/docs/**/*.ts', 'test/docs/**/*.test.ts')).toBe(true)
    expect(covers('./test/unit/*.ts', 'test/nuxt/*.test.ts')).toBe(false)
    expect(covers('./test/unit/*.ts', 'test/unit/sub/*.test.ts')).toBe(false)
    expect(projectGlobs("{ test: { name: 'a', include: ['test/a/*.test.ts'] } }, { include: ['b/*.ts', 'c/*.ts'] }")).toEqual(['test/a/*.test.ts', 'b/*.ts', 'c/*.ts'])
  })

  it('compiles the files of every vitest project', () => {
    const globs = projectGlobs(readFileSync(join(root, 'vitest.config.ts'), 'utf8'))
    // A config read that finds no project would pass for the wrong reason.
    expect(globs).toContain('test/unit/*.test.ts')
    const patterns = [...includes('tsconfig.test.json'), ...includes('tsconfig.node.json')]
    expect(globs.filter((glob) => !patterns.some((pattern) => covers(pattern, glob)))).toEqual([])
  })
})
