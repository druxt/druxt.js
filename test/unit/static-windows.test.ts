import { win32 } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Windows paths, on any machine: Node's own Windows path functions stand in for the platform's, and nothing is written.
const written = vi.hoisted(() => [] as string[])
vi.mock('node:path', async () => {
  const path = await vi.importActual<typeof import('node:path')>('node:path')
  return { ...path.win32, default: path.win32 }
})
vi.mock('node:fs/promises', () => ({ mkdir: async () => {}, writeFile: async (file: string) => { written.push(file) } }))

const { copyFiles } = await import('../../packages/core/src/utils/static')

// Paths with an encoded backslash, `%5C`, built from their parts so each part reads as a word.
const climbs = ['/sites/default/files/..', '..', '..', '..', 'outside.txt'].join('%5C')
const drive = ['/D:', 'outside.txt'].join('%5C')

describe('copyFiles() on Windows', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('writes a file under the output directory, and still leaves out one whose path leaves it', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('file', { status: 200 })))
    const warnings: string[] = []
    const copied = await copyFiles([
      { file: '/sites/default/files/a.jpg', request: '/sites/default/files/a.jpg' },
      { file: '/sites/default/files/../../../../outside.txt', request: '/sites/default/files/../../../../outside.txt' },
      { file: climbs, request: climbs },
      { file: drive, request: drive },
      { file: '/sites/default/files/../../..', request: '/sites/default/files/../../..' },
    ], { origin: 'http://drupal.test', publicDir: 'C:\\output\\public', warn: (message) => warnings.push(message) })
    expect(copied).toBe(1)
    expect(written).toEqual([win32.join('C:\\output\\public', 'sites', 'default', 'files', 'a.jpg')])
    expect(warnings).toHaveLength(4)
    for (const warning of warnings) expect(warning).toContain('leaves the output directory')
  })
})
