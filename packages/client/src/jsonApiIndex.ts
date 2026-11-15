import { nextRequest } from './processCache'
import type { ProcessCacheHandle } from './processCache'
import type { JsonApiIndex } from './types'

/** An index as fetched, with the seconds its responses let it be cached. */
export interface FetchedIndex {
  index: JsonApiIndex
  lifetime: number
}

export interface JsonApiIndexCacheOptions {
  /** What this site's index is keyed by in the process cache: the base URL, endpoint and resource config. */
  key: string
  /** Fetches the index for a prefix. */
  fetchIndex: (prefix: string) => Promise<FetchedIndex>
  /** The process cache for the `index` scope, or undefined when it must not be used. Asked for afresh each time. */
  shared: () => ProcessCacheHandle | undefined
}

/**
 * The JSON:API index per prefix, held for a client: fetched once, shared
 * between concurrent callers, read from and written to the process cache
 * where that is allowed, and dropped by `clear()`.
 *
 * A clear while a fetch is in flight hands that fetch's index to its callers
 * and keeps it nowhere, so the next caller fetches again. A failed fetch is
 * dropped the same way, so the next call retries.
 */
export class JsonApiIndexCache {
  /** The index per prefix; `''` is the unprefixed one. */
  readonly indexes: Record<string, JsonApiIndex> = {}
  /** Fetches in flight, per process cache key, so concurrent callers share one. */
  readonly requests: Record<string, Promise<FetchedIndex> | undefined> = {}
  /** Moves on each clear, so an index fetched before one is not kept. */
  generation = 0
  /** Each fetch's place in the order requests started in, so the process cache drops one a forget came after. */
  private readonly numbers = new WeakMap<Promise<FetchedIndex>, number>()
  /** The process cache consumer each fetch started as, the client's headers then, so it is stored under no other. */
  private readonly consumers = new WeakMap<Promise<FetchedIndex>, string | undefined>()

  private readonly key: string
  private readonly fetchIndex: (prefix: string) => Promise<FetchedIndex>
  private readonly shared: () => ProcessCacheHandle | undefined

  constructor({ key, fetchIndex, shared }: JsonApiIndexCacheOptions) {
    this.key = key
    this.fetchIndex = fetchIndex
    this.shared = shared
  }

  /**
   * The index for a prefix.
   *
   * @param prefix - The JSON:API endpoint prefix or langcode. Any empty value, such as 1.x's null, names the unprefixed index.
   */
  async get(prefix?: string | null): Promise<JsonApiIndex> {
    const key = prefix || ''
    const held = this.indexes[key]
    if (held) return held

    const requestKey = `${this.key}:${key}`

    // An index fetched by an earlier server request without credentials.
    const stored = this.shared()?.get<JsonApiIndex>(requestKey)
    if (stored) return (this.indexes[key] = stored)

    const before = this.shared()
    const since = before?.generation
    const started = this.generation
    let request = this.requests[requestKey]
    if (!request) {
      // Numbered when the fetch starts: a caller who joins it later shares its answer, and its number.
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

    // Fetched before a clear: answers this call, and is kept nowhere.
    if (started !== this.generation) return fetched.index

    this.indexes[key] = fetched.index
    // Dropped by the handle when the process cache was cleared, or its index scope forgotten, while the request was
    // in flight. Headers changed since the fetch started may pick another variant: it is stored under neither set.
    const after = this.shared()
    if (after && after.consumer === this.consumers.get(request)) after.set(requestKey, fetched.index, fetched.lifetime, since, this.numbers.get(request))
    return fetched.index
  }

  /** Drops every held index and every fetch in flight. */
  clear(): void {
    for (const prefix of Object.keys(this.indexes)) delete this.indexes[prefix]
    for (const key of Object.keys(this.requests)) delete this.requests[key]
    this.generation += 1
  }
}
