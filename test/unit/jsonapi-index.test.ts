import { describe, expect, it, vi } from 'vitest'
import { JsonApiIndexCache } from '../../packages/client/src/jsonApiIndex'
import type { FetchedIndex } from '../../packages/client/src/jsonApiIndex'
import type { ProcessCacheHandle } from '../../packages/client/src/processCache'

const fetched = (prefix: string, lifetime = 0): FetchedIndex => ({ index: { 'node--page': { href: `${prefix}/jsonapi/node/page` } }, lifetime })

/** A process cache handle over one map, with a generation the test moves on. */
const handle = (entries = new Map<string, unknown>(), state = { generation: 0 }) => {
  const writes: Array<[string, number, number | undefined]> = []
  const shared = (): ProcessCacheHandle => ({
    generation: state.generation,
    get: <T>(key: string) => entries.get(key) as T | undefined,
    set: <T>(key: string, value: T, seconds: number, since?: number) => {
      writes.push([key, seconds, since])
      if (since === undefined || since === state.generation) entries.set(key, value)
      return value
    },
  })
  return { entries, shared, state, writes }
}

const cache = (fetchIndex = vi.fn(async (prefix: string) => fetched(prefix)), shared: () => ProcessCacheHandle | undefined = () => undefined) =>
  ({ fetchIndex, cache: new JsonApiIndexCache({ key: 'site', fetchIndex, shared }) })

describe('JsonApiIndexCache', () => {
  it('fetches once per prefix and holds the result', async () => {
    const { cache: index, fetchIndex } = cache()
    expect(await index.get()).toEqual(fetched('').index)
    expect(await index.get(null)).toEqual(fetched('').index)
    expect(await index.get('')).toEqual(fetched('').index)
    expect((await index.get('/es'))['node--page']!.href).toBe('/es/jsonapi/node/page')
    expect(fetchIndex.mock.calls.map(([prefix]) => prefix)).toEqual(['', '/es'])
  })

  it('shares one fetch between concurrent callers', async () => {
    const { cache: index, fetchIndex } = cache()
    await Promise.all([index.get(), index.get(), index.get()])
    expect(fetchIndex).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed fetch instead of keeping the failure', async () => {
    const fetchIndex = vi.fn<(prefix: string) => Promise<FetchedIndex>>().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce(fetched(''))
    const { cache: index } = cache(fetchIndex)
    await expect(index.get()).rejects.toThrow('down')
    expect(await index.get()).toEqual(fetched('').index)
    expect(index.requests).toEqual({})
  })

  it('hands an index fetched before clear() to its callers, and keeps it nowhere', async () => {
    let resolve!: (value: FetchedIndex) => void
    const fetchIndex = vi.fn<(prefix: string) => Promise<FetchedIndex>>().mockImplementationOnce(() => new Promise((r) => { resolve = r })).mockResolvedValue(fetched(''))
    const { cache: index } = cache(fetchIndex)

    const pending = index.get()
    index.clear()
    resolve(fetched('', 300))
    expect(await pending).toEqual(fetched('').index)
    expect(index.indexes).toEqual({})
    expect(index.generation).toBe(1)

    await index.get()
    expect(fetchIndex).toHaveBeenCalledTimes(2)
  })

  it('reads a shared index before fetching, and stores a fetched one with its lifetime', async () => {
    const { entries, shared, writes } = handle()
    const { cache: index, fetchIndex } = cache(vi.fn(async (prefix: string) => fetched(prefix, 300)), shared)
    await index.get()
    expect(writes).toEqual([['site:', 300, 0]])
    expect(entries.get('site:')).toEqual(fetched('').index)

    const second = cache(vi.fn(async (prefix: string) => fetched(prefix)), shared)
    expect(await second.cache.get()).toEqual(fetched('').index)
    expect(second.fetchIndex).not.toHaveBeenCalled()
    expect(fetchIndex).toHaveBeenCalledTimes(1)
  })

  it('passes the generation it started at, so the handle drops an index fetched across a process cache clear', async () => {
    const { shared, state, writes, entries } = handle()
    let resolve!: (value: FetchedIndex) => void
    const fetchIndex = vi.fn<(prefix: string) => Promise<FetchedIndex>>().mockImplementationOnce(() => new Promise((r) => { resolve = r }))
    const { cache: index } = cache(fetchIndex, shared)

    const pending = index.get()
    state.generation += 1
    resolve(fetched('', 300))
    await pending
    expect(writes).toEqual([['site:', 300, 0]])
    expect(entries.has('site:')).toBe(false)
    // This client still holds it: only the shared copy was refused.
    expect(index.indexes['']).toEqual(fetched('').index)
  })

  it('does not touch the process cache when there is no handle', async () => {
    const shared = vi.fn(() => undefined)
    const { cache: index } = cache(undefined, shared)
    await index.get()
    expect(shared).toHaveBeenCalled()
    expect(index.indexes['']).toEqual(fetched('').index)
  })
})
