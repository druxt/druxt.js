// Process-wide cache for server-side responses to requests that carry no credentials.
// Held on globalThis so every copy of this module in the process shares one cache.

/** A place in a scope's order of use, which runs from its least recently used entry, `next`, round to its most, `prev`. */
interface Link { prev: Link, next: Link }
/** A stored value, or with none, the trace of a numbered answer that removed one. */
interface Entry extends Link { value: unknown, seconds: number, created: number, size: number, key: string, consumer: string, started?: number }
/** A consumer's entries, with their running size. */
type Entries = Map<string, Entry> & { [SIZE]?: number }
/** A scope's order of use across all its consumers' entries, with their running size and count. */
interface Order extends Link {
  size: number
  count: number
  /** Values stored since expired entries were last swept out. */
  writes: number
}
/** A scope: its consumers' entries, the least recently used consumer first, and the order of use across them. */
type Consumers = Map<string, Entries> & { [ORDER]?: Order }
type Scopes = Map<string, Consumers>
const shared = globalThis as typeof globalThis & Record<symbol, unknown>

// The running size of a consumer's entries, held on its map of entries.
const SIZE: unique symbol = Symbol.for('druxt.processCacheSize') as never
// A scope's order of use, held on its map of consumers.
const ORDER: unique symbol = Symbol.for('druxt.processCacheOrder') as never

/**
 * The consumers each scope keeps entries for at most, such as the sets of headers its clients send. Past it the least
 * recently used consumer goes, entries and all. `maxSize` bounds the scope whatever its consumers.
 */
export const MAX_PARTITIONS = 32

const SCOPES = Symbol.for('druxt.processCache')
const scopes = (shared[SCOPES] || (shared[SCOPES] = new Map())) as Scopes

// Moves on each clear, so a write from a request that was in flight at the time
// is refused. Shared like the scopes, so every copy of the module agrees.
const GENERATION = Symbol.for('druxt.processCacheGeneration')
const generation = (shared[GENERATION] || (shared[GENERATION] = { value: 0 })) as { value: number }

// Numbers requests in the order they start, shared like the scopes so every copy of the module counts on one sequence.
const SEQUENCE = Symbol.for('druxt.processCacheSequence')
const sequence = (shared[SEQUENCE] || (shared[SEQUENCE] = { value: 0 })) as { value: number }

// The last request number each scope's forget saw, shared like the scopes: a request started before it may hold what
// the forget dropped, so its answer is not stored.
const FORGOTTEN = Symbol.for('druxt.processCacheForgotten')
const forgotten = (shared[FORGOTTEN] || (shared[FORGOTTEN] = new Map())) as Map<string, number>

/** A scope's consumers, made with an empty order of use the first time it is asked for. */
const scopeOf = (scope: string): Consumers => {
  let consumers = scopes.get(scope)
  if (!consumers) scopes.set(scope, consumers = new Map())
  if (!consumers[ORDER]) {
    const order = { size: 0, count: 0, writes: 0 } as Order
    order.prev = order.next = order
    consumers[ORDER] = order
  }
  return consumers
}

/** Takes an entry out of its scope's order of use. */
const unlink = (entry: Link) => {
  entry.prev.next = entry.next
  entry.next.prev = entry.prev
}

/** Makes an entry its scope's most recently used. */
const use = (order: Order, entry: Entry) => {
  entry.prev = order.prev
  entry.next = order
  order.prev.next = entry
  order.prev = entry
}

/** Removes an entry from its scope, and its consumer with it once that holds nothing. */
const drop = (consumers: Consumers, entry: Entry) => {
  const order = consumers[ORDER]!
  unlink(entry)
  order.size -= entry.size
  order.count--
  const entries = consumers.get(entry.consumer)
  if (!entries) return
  entries.delete(entry.key)
  entries[SIZE] = (entries[SIZE] || 0) - entry.size
  if (!entries.size) consumers.delete(entry.consumer)
}

/** The next number in the order requests start in, unique within the process. */
export const nextRequest = (): number => ++sequence.value

// Where the code runs.
const runtime = { isServer: (): boolean => typeof window === 'undefined' }

// Drupal names its session cookie SESS or SSESS plus a hash.
const DRUPAL_SESSION_COOKIE = 'S?SESS[0-9a-f]+'

// Druxt's own token cookies, which the site's server sets when it holds the session. They are credentials whatever
// the site's session cookie is named, so a `sessionCookie` pattern adds to them and never replaces them.
const DRUXT_TOKEN_COOKIE = 'druxt\\.auth\\.(?:access|refresh)_token'

/**
 * The size of a string in UTF-8 bytes, counted from its UTF-16 code units, with no Buffer, as this file is part of
 * the browser bundle too.
 *
 * @param text - The text to measure.
 */
export const byteSize = (text: string): number => {
  let bytes = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code < 0x80) bytes += 1
    else if (code < 0x800) bytes += 2
    // A high surrogate and the low one after it are one four-byte character.
    else if (code >= 0xD800 && code <= 0xDBFF && i + 1 < text.length) {
      bytes += 4
      i++
    } else bytes += 3
  }
  return bytes
}

/** The size a value counts for against `maxSize`: the bytes of its JSON. */
const jsonSize = (value: unknown): number => {
  try {
    return byteSize(typeof value === 'string' ? value : JSON.stringify(value) || '')
  } catch {
    return 0
  }
}

type HeaderSet = Record<string, unknown> | Headers | undefined

/** Headers as a plain object, from a record or a Fetch `Headers`. */
const plain = (headers: unknown): Record<string, unknown> => {
  if (typeof Headers !== 'undefined' && headers instanceof Headers) return Object.fromEntries(headers.entries())
  return (headers && typeof headers === 'object' ? headers : {}) as Record<string, unknown>
}

/**
 * Whether headers carry credentials: an Authorization header, or a cookie
 * holding a session or one of Druxt's tokens. An Origin counts too, as the cache key cannot tell it apart.
 *
 * @param headers - The request headers.
 * @param sessionCookie - A pattern for the session cookie name. Druxt's token cookies count whatever it is.
 */
export const headersHaveCredentials = (headers: HeaderSet, sessionCookie = DRUPAL_SESSION_COOKIE): boolean => {
  const session = new RegExp(`(?:^|;\\s*)(?:${sessionCookie}|${DRUXT_TOKEN_COOKIE})=`, 'i')
  return Object.entries(plain(headers)).some(([name, raw]) => {
    // A header object such as Node's takes an array for a value.
    const value = Array.isArray(raw) ? raw.join('; ') : raw
    if (!value || typeof value === 'object') return false
    const header = name.toLowerCase()
    // An Origin counts too: Drupal varies by it, and the cache key holds none.
    return header === 'authorization' || header === 'origin' || (header === 'cookie' && session.test(String(value)))
  })
}

/**
 * How long a shared cache may keep a response, from its headers.
 *
 * Follows Cache-Control as a shared cache must: `private`, `no-store` or
 * `no-cache` forbid storing, `s-maxage` wins over `max-age`, time already spent
 * in a cache in front of Drupal (`Age`) is taken off, and no directive means 0.
 * A `Vary` on any request header other than `Cookie` or `Accept-Encoding` also
 * forbids storing, as the cache key holds nothing that could tell variants apart.
 *
 * @param headers - The response headers.
 * @returns Seconds the response may be kept, 0 when it may not.
 */
export const parseCacheLifetime = (headers?: unknown): number => {
  // Every key that names the header, whatever its case, joined as a list header is.
  const header = (name: string) => Object.entries(plain(headers))
    .filter(([key]) => key.toLowerCase() === name)
    .map(([, value]) => String(value))
    .join(', ')

  const directives = header('cache-control').toLowerCase().split(',').map((d) => d.trim())
  if (directives.some((d) => ['private', 'no-store', 'no-cache'].includes(d))) return 0

  // The cache is keyed by URL alone, so a response that varies by a header the
  // visitor's browser sends, such as Accept-Language, cannot be stored. A header
  // the site's own client sends the same way on every request tells no variants
  // apart, and Drupal names four of those on cacheable responses: Cookie,
  // which its own page cache also ignores without a session; X-Consumer-ID,
  // which no browser sets and which keys a client's own entries;
  // Accept-Encoding, harmless since the decoded document is what is stored; and
  // Origin, which Drupal's CORS adds whenever it is on and which the site's
  // server never sends, so every answer is the one for no origin.
  const vary = header('vary').toLowerCase().split(',').map((v) => v.trim()).filter(Boolean)
  if (vary.some((v) => !['cookie', 'x-consumer-id', 'accept-encoding', 'origin'].includes(v))) return 0

  const seconds = (name: string) => {
    const directive = directives.find((d) => d.startsWith(`${name}=`))
    // The whole value must be digits: parseInt would read 300 from `300abc`.
    const value = directive ? directive.slice(name.length + 1) : ''
    return /^\d+$/.test(value) ? Number(value) : NaN
  }
  // A present but unusable s-maxage means stale, not "use max-age instead".
  const lifetime = directives.some((d) => d.startsWith('s-maxage=')) ? seconds('s-maxage') : seconds('max-age')
  if (Number.isNaN(lifetime)) return 0

  // Age already spent in a cache in front of Drupal, from the Age header
  // alone. Drupal's own page cache serves a stored response with its original
  // Date and no Age, so an age read from Date would leave nothing to keep
  // once that entry is five minutes old.
  const age = parseInt(header('age'), 10) || 0
  return Math.max(0, lifetime - age)
}

// How long each fetched document may be cached, with its arrival time.
const lifetimes = new WeakMap<object, { seconds: number, at: number }>()

/**
 * Remember how long a document may be cached, from the headers it arrived with.
 *
 * @param document - A parsed response body; anything but an object is not kept.
 * @param headers - The response headers.
 */
export const rememberLifetime = (document: unknown, headers: unknown): void => {
  if (!document || typeof document !== 'object') return
  lifetimes.set(document, { seconds: parseCacheLifetime(headers), at: Date.now() })
}

/**
 * Remember a document's lifetime as another copy of it had it: the seconds it was given, counted from when that copy
 * arrived, so a copy read from the process cache reports what is left.
 *
 * @param document - A parsed response body; anything but an object is not kept.
 * @param seconds - The seconds the response may be kept.
 * @param at - When the response arrived, in milliseconds.
 */
export const rememberLifetimeFrom = (document: unknown, seconds: number, at: number): void => {
  if (!document || typeof document !== 'object') return
  lifetimes.set(document, { seconds, at })
}

/**
 * How long a remembered document may still be cached.
 *
 * @param document - A document `rememberLifetime()` saw.
 * @returns Seconds left, counted from when the response arrived. 0 when it may not be cached or is unknown.
 */
export const lifetimeLeft = (document: unknown): number => {
  if (!document || typeof document !== 'object') return 0
  const record = lifetimes.get(document)
  if (!record) return 0
  return Math.max(0, record.seconds - Math.floor((Date.now() - record.at) / 1000))
}

export interface ProcessCacheHandle {
  /** The generation this handle was taken at. */
  generation: number
  /** The consumer whose entries it reads and writes: compare a handle taken after a request with one taken before. */
  consumer: string
  get<T = unknown>(key: string): T | undefined
  set<T>(key: string, value: T, seconds: number, since?: number, started?: number): T
}

export interface ProcessCacheHandleOptions {
  /** Whether the client sends credentials. */
  credentialed?: boolean
  /** What keeps a client's entries apart from another's, such as the headers it sends: each value keeps its own. */
  consumer?: string
  /** Seconds an entry may live at most. It shortens a lifetime, never extends one, and 0 keeps nothing. */
  ttl?: number
  /**
   * The size the scope keeps at most, in bytes of stored JSON, across all its consumers. Past it, expired entries go
   * first, then the scope's least recently used, whichever consumer holds it, and a value larger than the whole limit
   * is not stored.
   */
  maxSize?: number
  /** Measures a value for `maxSize`. The bytes of its JSON by default. */
  sizeOf?: (value: unknown) => number
}

/**
 * Get the process cache for a scope.
 *
 * Returns undefined in a browser or for a client that sends credentials, so a
 * response built for one user is never stored or served. Each entry lives for
 * the lifetime it is stored with, which comes from the response's Cache-Control.
 * Store a value only after its request has resolved, and ask for the cache
 * again at that point: the request may have shown the client to be credentialed.
 *
 * @param scope - The cache scope, e.g. 'index'.
 * @param options - The cache options.
 * @param options.credentialed - Whether the client sends credentials.
 * @param options.consumer - What keeps a client's entries apart, such as the headers it sends: each value keeps its own.
 * @param options.ttl - Seconds an entry may live at most. It shortens a lifetime, never extends one, and 0 keeps nothing.
 */
export const processCache = (scope: string, { credentialed = false, consumer = '', ttl, maxSize, sizeOf = jsonSize }: ProcessCacheHandleOptions = {}): ProcessCacheHandle | undefined => {
  if (!runtime.isServer() || credentialed) return undefined

  const consumers = scopeOf(scope)
  const order = consumers[ORDER]!
  // The consumer's entries, made the scope's most recently used consumer. A new one past MAX_PARTITIONS evicts the
  // least recently used, entries and all. A read finds none it does not hold, so a miss makes no partition.
  const partition = (create: boolean): Entries | undefined => {
    const held = consumers.get(consumer)
    if (!held && !create) return undefined
    const entries: Entries = held || new Map()
    // A Map keeps insertion order, so moving the consumer to the end keeps the least recently used first.
    consumers.delete(consumer)
    if (!held) {
      for (const [key, evicted] of consumers) {
        if (consumers.size < MAX_PARTITIONS) break
        for (const entry of evicted.values()) drop(consumers, entry)
        consumers.delete(key)
      }
    }
    consumers.set(consumer, entries)
    return entries
  }
  // A ttl caps what may be kept, so 0 keeps nothing; without one, Drupal's lifetime stands.
  const cap = (seconds: number) => (typeof ttl === 'number' ? Math.min(seconds, ttl) : seconds)
  const taken = generation.value

  const expired = (entry: Entry, now = Date.now()) => now - entry.created >= entry.seconds * 1000
  const bounded = typeof maxSize === 'number'
  // Keeps the scope within `maxSize`: expired entries go first, then the least recently used, whoever holds them.
  // The sweep for expired entries reads them all, so it runs once the scope has stored as many values as it holds
  // since the last one, which keeps a write's cost the same however many entries the scope holds.
  const bound = () => {
    if (!bounded || order.size <= maxSize) return
    if (order.writes >= order.count) {
      order.writes = 0
      const now = Date.now()
      for (let link = order.next; link !== order;) {
        const entry = link as Entry
        link = link.next
        if (expired(entry, now)) drop(consumers, entry)
      }
    }
    while (order.size > maxSize && order.next !== order) drop(consumers, order.next as Entry)
  }

  return {
    // The generation this handle was taken at. Compare a handle taken after a
    // request resolves against one taken before it started: a difference means
    // the cache was cleared while the request was in flight.
    generation: taken,
    consumer,

    // The reader's cap applies too, so a shorter ttl never serves an older entry.
    get<T = unknown>(key: string): T | undefined {
      const entry = partition(false)?.get(key)
      if (!entry) return undefined
      // Past its own lifetime the entry is no use to any reader, so it goes.
      if (expired(entry)) {
        drop(consumers, entry)
        return undefined
      }
      if (entry.value === undefined) return undefined
      if (Date.now() - entry.created >= cap(entry.seconds) * 1000) return undefined
      unlink(entry)
      use(order, entry)
      return entry.value as T
    },

    /**
     * Store a value, unless a clear has happened since this handle was taken, a forget of the scope since its
     * request started, or a request that started later has stored or removed the entry.
     *
     * A value that may not be kept also removes what an earlier response
     * stored under the key, so the cache follows Drupal's latest answer. With a
     * request number, it leaves that number in the entry's place, holding no
     * value, as a stored value does: the trace counts as the bytes of its key,
     * and goes as an entry does.
     *
     * @param key - The cache key.
     * @param value - The value to store.
     * @param seconds - Seconds the value may be kept.
     * @param since - A generation the value was fetched at. The value is dropped when a clear has happened since.
     * @param started - The request's number from `nextRequest()`. The value is dropped when it started before the
     * scope's last forget, which it may predate, or before the request whose answer the entry holds or removed.
     * @returns The value, stored or not.
     */
    set<T>(key: string, value: T, seconds: number, since?: number, started?: number): T {
      if (since !== undefined && since !== generation.value) return value
      if (started !== undefined && started <= (forgotten.get(scope) ?? 0)) return value
      const earlier = consumers.get(consumer)?.get(key)
      if (earlier && started !== undefined && (earlier.started ?? 0) > started) return value
      if (earlier) drop(consumers, earlier)
      let kept: unknown = value
      let lifetime = cap(seconds)
      let size = lifetime > 0 ? sizeOf(value) : 0
      // A value larger than the whole limit would empty the scope and still not fit, so it is not kept either. Only
      // what is kept makes a partition.
      if (lifetime <= 0 || (bounded && size > maxSize)) {
        if (started === undefined) return value
        kept = undefined
        lifetime = cap(Infinity)
        size = byteSize(key)
        if (lifetime <= 0 || (bounded && size > maxSize)) return value
      }
      const entries = partition(true)!
      const entry = { value: kept, seconds: lifetime, created: Date.now(), size, key, consumer, started } as Entry
      entries.set(key, entry)
      entries[SIZE] = (entries[SIZE] || 0) + size
      use(order, entry)
      order.size += size
      order.count++
      order.writes++
      bound()
      return value
    },
  }
}

/**
 * How many times the process cache has been emptied. A hold kept beside the cache, such as which menu source a site
 * offers, compares it with the count it was taken at, and lets go once a clear has moved it on.
 *
 * @returns The count, shared by every copy of this module in the process.
 */
export const processCacheGeneration = (): number => generation.value

/**
 * Drops the entries of a scope a test names, for every consumer, such as the responses that held a resource an
 * editor just saved. The generation does not move, but no answer to a request of the scope in flight now is stored:
 * it may hold what was dropped.
 *
 * @param scope - The scope.
 * @param test - Called with each key.
 * @returns How many entries went.
 */
export const forgetProcessCache = (scope: string, test: (key: string) => boolean): number => {
  forgotten.set(scope, sequence.value)
  let dropped = 0
  const consumers = scopes.get(scope)
  if (!consumers) return 0
  for (const entries of [...consumers.values()]) {
    for (const entry of [...entries.values()]) {
      if (!test(entry.key)) continue
      drop(consumers, entry)
      dropped++
    }
  }
  return dropped
}

/**
 * Empty the process cache.
 *
 * @param scope - The scope to empty. All scopes when omitted.
 */
export const resetProcessCache = (scope?: string): void => {
  if (scope) scopes.delete(scope)
  else scopes.clear()
  generation.value += 1
}
