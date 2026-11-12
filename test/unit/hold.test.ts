import { describe, expect, it, vi } from 'vitest'
import { createStorage } from 'unstorage'
import { createDruxtConfigHold } from '../../packages/core/src/runtime/server/hold'
import type { DruxtConfigHoldOptions } from '../../packages/core/src/runtime/server/hold'

const FORMATS = [{ type: 'date_format--date_format', id: 'f1', attributes: { drupal_internal__id: 'medium', pattern: 'D, m/d/Y - H:i' } }]

// The date format hold's cases, under the generic name: entity holds Drupal's date formats with it, as `date-formats`.
const createDateFormatHold = (options: Omit<DruxtConfigHoldOptions<typeof FORMATS>, 'name'>) => createDruxtConfigHold({ ...options, name: 'date-formats' })

describe('createDruxtConfigHold()', () => {
  it('reads once per language, and serves the held formats after', async () => {
    const storage = createStorage()
    const read = vi.fn(async () => ({ value: FORMATS }))
    const hold = createDateFormatHold({ storage, buildId: 'b1', read })
    expect(await hold.get('en')).toEqual(FORMATS)
    expect(await hold.get('en')).toEqual(FORMATS)
    await hold.get('es')
    expect(read.mock.calls).toEqual([['en'], ['es']])
    expect(await storage.getItem('date-formats:b1:en')).toEqual({ value: FORMATS })
  })

  it('shares one read between concurrent renders', async () => {
    const read = vi.fn(async () => ({ value: FORMATS }))
    const hold = createDateFormatHold({ storage: createStorage(), buildId: 'b1', read })
    await Promise.all([hold.get('en'), hold.get('en'), hold.get('en')])
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('reads again after a clear, and sweeps every build\'s formats', async () => {
    const storage = createStorage()
    await storage.setItem('date-formats:old:en', [])
    await storage.setItem('schema:b1:epoch', 1)
    const read = vi.fn(async () => ({ value: FORMATS }))
    const hold = createDateFormatHold({ storage, buildId: 'b1', read })
    await hold.get('en')
    await hold.clear()
    expect(await storage.getKeys('date-formats:')).toEqual([])
    expect(await storage.getItem('schema:b1:epoch')).toBe(1)
    await hold.get('en')
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('holds no failed read, and no read that spans a clear', async () => {
    const storage = createStorage()
    const read = vi.fn<(prefix: string) => Promise<{ value: typeof FORMATS }>>().mockRejectedValueOnce(new Error('503'))
    const hold = createDateFormatHold({ storage, buildId: 'b1', read })
    await expect(hold.get('en')).rejects.toThrow('503')
    expect(await storage.getItem('date-formats:b1:en')).toBeNull()

    let finish: (read: { value: typeof FORMATS }) => void = () => {}
    read.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const spanning = hold.get('en')
    await new Promise((resolve) => setTimeout(resolve, 0))
    await hold.clear()
    finish({ value: FORMATS })
    expect(await spanning).toEqual(FORMATS)
    expect(await storage.getItem('date-formats:b1:en')).toBeNull()
  })

  it('keys a language prefix left empty', async () => {
    const storage = createStorage()
    const hold = createDateFormatHold({ storage, buildId: 'b1', read: async () => ({ value: FORMATS }) })
    await hold.get()
    expect(await storage.getKeys('date-formats:')).toEqual(['date-formats:b1:-'])
  })

  it('holds a read with a maxAge only that long, then reads again', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      vi.setSystemTime(new Date('2026-10-18T00:00:00Z'))
      const read = vi.fn(async () => ({ value: FORMATS, maxAge: 60 }))
      const hold = createDateFormatHold({ storage: createStorage(), buildId: 'b1', read })
      await hold.get('en')
      vi.setSystemTime(new Date('2026-10-18T00:00:59Z'))
      await hold.get('en')
      expect(read).toHaveBeenCalledTimes(1)
      vi.setSystemTime(new Date('2026-10-18T00:01:01Z'))
      await hold.get('en')
      expect(read).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('lets a failed read stand for failureMaxAge, so a failing Drupal is read once per window', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      vi.setSystemTime(new Date('2026-10-18T00:00:00Z'))
      const read = vi.fn<(prefix: string) => Promise<{ value: typeof FORMATS }>>().mockRejectedValue(new Error('503'))
      const hold = createDateFormatHold({ storage: createStorage(), buildId: 'b1', read, failureMaxAge: 60 })
      for (let i = 0; i < 3; i++) await expect(hold.get('en')).rejects.toThrow('503')
      expect(read).toHaveBeenCalledTimes(1)
      // Another prefix has its own window.
      await expect(hold.get('es')).rejects.toThrow('503')
      expect(read).toHaveBeenCalledTimes(2)

      vi.setSystemTime(new Date('2026-10-18T00:01:01Z'))
      read.mockResolvedValueOnce({ value: FORMATS })
      expect(await hold.get('en')).toEqual(FORMATS)
      expect(read).toHaveBeenCalledTimes(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it('drops a standing failure on a clear', async () => {
    const read = vi.fn<(prefix: string) => Promise<{ value: typeof FORMATS }>>().mockRejectedValueOnce(new Error('503')).mockResolvedValue({ value: FORMATS })
    const hold = createDateFormatHold({ storage: createStorage(), buildId: 'b1', read, failureMaxAge: 60 })
    await expect(hold.get('en')).rejects.toThrow('503')
    await hold.clear()
    expect(await hold.get('en')).toEqual(FORMATS)
  })

  it('keeps two named holds apart on one storage, and clears only its own', async () => {
    const storage = createStorage()
    const formats = createDateFormatHold({ storage, buildId: 'b1', read: async () => ({ value: FORMATS }) })
    const blocks = createDruxtConfigHold<string[]>({ storage, buildId: 'b1', name: 'blocks', read: async (key) => ({ value: [key] }) })
    await formats.get('en')
    expect(await blocks.get('olivero:en')).toEqual(['olivero:en'])
    expect((await storage.getKeys()).sort()).toEqual(['blocks:b1:olivero:en', 'date-formats:b1:en'])
    await blocks.clear()
    expect(await storage.getKeys()).toEqual(['date-formats:b1:en'])
  })

  it('reads again over a stored entry that holds no value', async () => {
    const storage = createStorage()
    await storage.setItem('date-formats:b1:en', { formats: FORMATS })
    const read = vi.fn(async () => ({ value: FORMATS }))
    expect(await createDateFormatHold({ storage, buildId: 'b1', read }).get('en')).toEqual(FORMATS)
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('throws a TypeError naming an empty name, or one with a colon', () => {
    const options = { storage: createStorage(), buildId: 'b1', read: async () => ({ value: FORMATS }) }
    expect(() => createDruxtConfigHold({ ...options, name: '' })).toThrow(TypeError)
    expect(() => createDruxtConfigHold({ ...options, name: '' })).toThrow(/name/)
    expect(() => createDruxtConfigHold({ ...options, name: 'a:b' })).toThrow(TypeError)
    expect(() => createDruxtConfigHold({ ...options, name: 'a/b' })).toThrow(TypeError)
  })

  it('holds a read of undefined as null, so a JSON driver keeps the entry and it is not read again', async () => {
    const storage = createStorage()
    const read = vi.fn(async () => ({ value: undefined as string[] | undefined }))
    const hold = createDruxtConfigHold({ storage, buildId: 'b1', name: 'blocks', read })
    expect(await hold.get('olivero')).toBeNull()
    expect(await storage.getItem('blocks:b1:olivero')).toEqual({ value: null })
    expect(await hold.get('olivero')).toBeNull()
    expect(read).toHaveBeenCalledTimes(1)
  })
})
