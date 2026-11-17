import { nextRequest } from './processCache'
import type { ProcessCacheHandle } from './processCache'
import type { JsonApiIndex } from './types'

/** An index as fetched, with the seconds its responses let it be cached. */
export interface FetchedIndex {
  index: JsonApiIndex
  lifetime: number
}

export interface JsonApiIndexCacheOptions {
  /** The key of this site's index in the process cache: its base URL, endpoint and resource config. */
  key: string
  /** Fetches the index for a prefix. */
  fetchIndex: (prefix: string) => Promise<FetchedIndex>
  /** Gets the process cache for the `index` scope, or undefined when it must not be used. Called on each use. */
  shared: () => ProcessCacheHandle | undefined
}

/**
 * Holds the JSON:API index for each prefix, for one client.
 *
 * - An index is fetched once.
 * - Concurrent callers share one fetch.
 * - An index is read from the process cache, and written to it, where that is allowed.
 * - `clear()` drops every index.
 *
 * A clear while a fetch is in flight gives that fetch's index to its callers and keeps it nowhere. So the next
 * caller fetches again. A failed fetch is dropped the same way, so the next call retries.
 */
export class JsonApiIndexCache {
  /** The index for each prefix. `''` is the index with no prefix. */
  readonly indexes: Record<string, JsonApiIndex> = {}

  /** The fetches in flight, by process cache key. Concurrent callers share them. */
  readonly requests: Record<string, Promise<FetchedIndex> | undefined> = {}

  /** A counter that each clear moves on. An index fetched before a clear is not kept. */
  generation = 0

  /** Each fetch's place in the order requests started in. The process cache uses it to refuse a stale answer. */
  private readonly numbers = new WeakMap<Promise<FetchedIndex>, number>()

  /**
   * The process cache consumer each fetch started as: the client's headers at that time.
   *
   * An index is stored only under the consumer it was fetched as.
   */
  private readonly consumers = new WeakMap<Promise<FetchedIndex>, string | undefined>()

  private readonly key: string
  private readonly fetchIndex: (prefix: string) => Promise<FetchedIndex>
  private readonly shared: () => ProcessCacheHandle | undefined

  /**
   * @param options - The cache's key, how it fetches an index, and how it gets the process cache.
   */
  constructor({ key, fetchIndex, shared }: JsonApiIndexCacheOptions) {
    this.key = key
    this.fetchIndex = fetchIndex
    this.shared = shared
  }

  /**
   * Gets the index for a prefix.
   *
   * @param prefix - The JSON:API endpoint prefix or langcode. Any empty value, such as 1.x's null, means no prefix.
   * @returns The index.
   */
  async get(prefix?: string | null): Promise<JsonApiIndex> {
    const key = prefix || ''
    const held = this.indexes[key]
    if (held) return held

    const requestKey = `${this.key}:${key}`

    // The process cache may hold an index that an earlier server request fetched without credentials.
    const stored = this.shared()?.get<JsonApiIndex>(requestKey)
    if (stored) return (this.indexes[key] = stored)

    const before = this.shared()
    const since = before?.generation
    const started = this.generation

    let request = this.requests[requestKey]
    if (!request) {
      // The fetch is numbered as it starts. A caller who joins it later shares its answer, and its number.
      const number = nextRequest()
      request = this.requests[requestKey] = this.fetchIndex(key)
      this.numbers.set(request, number)
      this.consumers.set(request, before?.consumer)
    }

    let fetched: FetchedIndex
    try {
      fetched = await request
    } finally {
      if (this.requests[requestKey] === request) delete this.requests[requestKey]
    }

    // An index fetched before a clear answers this call, and is kept nowhere.
    if (started !== this.generation) return fetched.index

    this.indexes[key] = fetched.index

    // The handle drops the write when the process cache was cleared, or its index scope forgotten, while the fetch
    // was in flight. The client's headers may also have changed since the fetch started. The index could then be
    // either set's variant, so it is stored under neither.
    const after = this.shared()
    if (after && after.consumer === this.consumers.get(request)) {
      after.set(requestKey, fetched.index, fetched.lifetime, since, this.numbers.get(request))
    }

    return fetched.index
  }

  /** Drops every held index and every fetch in flight. */
  clear(): void {
    for (const prefix of Object.keys(this.indexes)) delete this.indexes[prefix]
    for (const key of Object.keys(this.requests)) delete this.requests[key]
    this.generation += 1
  }
}
