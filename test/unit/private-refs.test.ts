import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../..', import.meta.url))

// A private tracker's references: an issue, a merge request or a project shorthand. They never ship.
const PRIVATE = /\bgl(?:#\d+|!\d+|:[a-z][\w-]*)/i

/** The tracked files under the paths that ship, document or exercise the packages, and the root READMEs. */
const shipped = (): string[] => execFileSync('git', ['ls-files', '-z', '--', 'packages', 'test', 'docs', 'examples', 'scripts', '.changeset', ':(glob)*.md'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((file) => file !== 'test/unit/private-refs.test.ts')

/** Each line of the files under a directory that holds a private reference, as `<file>:<line>`. */
const found = (dir: string, files: string[]): string[] => files.flatMap((file) => {
  let text: string
  try {
    text = readFileSync(join(dir, file), 'utf8')
  } catch {
    return []
  }
  return text.split('\n').flatMap((line, i) => (PRIVATE.test(line) ? [`${file}:${i + 1}`] : []))
})

describe('private references', () => {
  it('matches each form a private reference takes, and nothing like them', () => {
    for (const text of ['gl#288', 'GL!171', 'gl:auth', 'see gl#9.']) expect(PRIVATE.test(text), text).toBe(true)
    for (const text of ['gh#781', 'do#3123', 'glob#1', 'ngl#2', 'gl #3']) expect(PRIVATE.test(text), text).toBe(false)
  })

  it('appear in no tracked file that ships or documents the packages', () => {
    // Positive control: the scan catches a private reference in a file it reads.
    const control = mkdtempSync(join(tmpdir(), 'druxt-private-refs-'))
    try {
      writeFileSync(join(control, 'README.md'), 'Fixed in gl#0.\n')
      expect(found(control, ['README.md'])).toEqual(['README.md:1'])
    } finally {
      rmSync(control, { recursive: true, force: true })
    }
    const files = shipped()
    // The scan surface: the root READMEs, the examples and the scripts.
    expect(files).toEqual(expect.arrayContaining(['README.md', 'examples/README.md', 'scripts/release/check.mjs']))
    expect(found(root, files)).toEqual([])
  })
})
