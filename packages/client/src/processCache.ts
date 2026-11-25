// The process cache: one cache for the whole process, for server-side responses to requests without credentials.
//
// Its state is held on `globalThis`, so every copy of this module in the process shares one cache.
//
// Two terms are used throughout:
//
// - A scope is one area of the cache. It holds one kind of answer, such as `index` or `content`.
// - A consumer is one set of client headers. Each consumer keeps its own entries in a scope.

/**
 * A place in a scope's order of use.
 *
 * The order is a ring. `next` leads from the least recently used entry round to the most recently used, and `prev`
 * leads back.
 */
interface Link { prev: Link, next: Link }

/** A stored value. An entry with no value is the trace of a numbered answer that removed one. */
interface Entry extends Link {
  value: unknown
  seconds: number
  created: number
  size: number
  key: string
  consumer: string
  started?: number
}

/** A consumer's entries, with their running size. */
type Entries = Map<string, Entry> & { [SIZE]?: number }

/** A scope's order of use across all its consumers' entries, with their running size and count. */
interface Order extends Link {
  size: number
  count: number
  /** How many values were stored since expired entries were last swept out. */
  writes: number
}

/** A scope: its consumers' entries, least recently used consumer first, and the order of use across them. */
type Consumers = Map<string, Entries> & { [ORDER]?: Order }

type Scopes = Map<string, Consumers>

const shared = globalThis as typeof globalThis & Record<symbol, unknown>

// The running size of a consumer's entries, held on its map of entries.
const SIZE: unique symbol = Symbol.for('druxt.processCacheSize') as never

// A scope's order of use, held on its map of consumers.
const ORDER: unique symbol = Symbol.for('druxt.processCacheOrder') as never

/**
 * The most consumers a scope keeps entries for.
 *
 * Past this number, the least recently used consumer goes, with all its entries. `maxSize` bounds the scope's size
 * however many consumers it has.
 */
export const MAX_PARTITIONS = 32

const SCOPES = Symbol.for('druxt.processCache')
const scopes = (shared[SCOPES] || (shared[SCOPES] = new Map())) as Scopes

// A counter that moves on each clear. A write from a request that was in flight during a clear is refused. It is
// shared like the scopes, so every copy of the module agrees.
const GENERATION = Symbol.for('druxt.processCacheGeneration')
const generation = (shared[GENERATION] || (shared[GENERATION] = { value: 0 })) as { value: number }

// Numbers requests in the order they start. It is shared like the scopes, so every copy of the module counts on one
// sequence.
const SEQUENCE = Symbol.for('druxt.processCacheSequence')
const sequence = (shared[SEQUENCE] || (shared[SEQUENCE] = { value: 0 })) as { value: number }

// For each scope, the last request number its latest forget saw. A request that started before the forget may hold
// what the forget removed, so its answer is not stored. It is shared like the scopes.
const FORGOTTEN = Symbol.for('druxt.processCacheForgotten')
const forgotten = (shared[FORGOTTEN] || (shared[FORGOTTEN] = new Map())) as Map<string, number>

/** Gets a scope's consumers. A scope is made, with an empty order of use, the first time it is asked for. */
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

/** Removes an entry from its scope. Its consumer is removed too, once it holds nothing. */
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

/** Gets the next number in the order requests start in. It is unique within the process. */
export const nextRequest = (): number => ++sequence.value

// Tells a server from a browser.
const runtime = { isServer: (): boolean => typeof window === 'undefined' }

// Drupal names its session cookie `SESS` or `SSESS`, followed by a hash.
const DRUPAL_SESSION_COOKIE = 'S?SESS[0-9a-f]+'

// Druxt's own token cookies, which the site's server sets when it holds the session. They are credentials whatever
// the site's session cookie is named. So a `sessionCookie` pattern adds to them, and never replaces them.
const DRUXT_TOKEN_COOKIE = 'druxt\\.auth\\.(?:access|refresh)_token'

/**
 * Measures a string in UTF-8 bytes.
 *
 * It counts from the string's UTF-16 code units and uses no `Buffer`, because this file is in the browser bundle too.
 *
 * @param text - The text to measure.
 * @returns The size in bytes.
 */
export const byteSize = (text: string): number => {
  let bytes = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code < 0x80) bytes += 1
    else if (code < 0x800) bytes += 2
    // A high surrogate and the low surrogate after it are one four-byte character.
    else if (code >= 0xD800 && code <= 0xDBFF && i + 1 < text.length) {
      bytes += 4
      i++
    } else bytes += 3
  }
  return bytes
}

/** The size a value counts for against `maxSize`: the bytes of its JSON. 0 for a value that has no JSON. */
const jsonSize = (value: unknown): number => {
  try {
    return byteSize(typeof value === 'string' ? value : JSON.stringify(value) || '')
  } catch {
    return 0
  }
}

type HeaderSet = Record<string, unknown> | Headers | undefined

/** Gets headers as a plain object, from a record or a Fetch `Headers`. */
const plain = (headers: unknown): Record<string, unknown> => {
  if (typeof Headers !== 'undefined' && headers instanceof Headers) return Object.fromEntries(headers.entries())
  return (headers && typeof headers === 'object' ? headers : {}) as Record<string, unknown>
}

/**
 * Whether headers carry credentials.
 *
 * Credentials are an `Authorization` header, or a cookie that holds a session or one of Druxt's tokens. An `Origin`
 * header counts too, because Drupal varies its answer by it and the cache key holds no origin.
 *
 * @param headers - The request headers.
 * @param sessionCookie - A pattern for the session cookie's name. Druxt's token cookies count whatever it is.
 */
export const headersHaveCredentials = (headers: HeaderSet, sessionCookie = DRUPAL_SESSION_COOKIE): boolean => {
  const session = new RegExp(`(?:^|;\\s*)(?:${sessionCookie}|${DRUXT_TOKEN_COOKIE})=`, 'i')
  return Object.entries(plain(headers)).some(([name, raw]) => {
    // A header object such as Node's may hold an array as a value.
    const value = Array.isArray(raw) ? raw.join('; ') : raw
    if (!value || typeof value === 'object') return false
    const header = name.toLowerCase()
    return header === 'authorization' || header === 'origin' || (header === 'cookie' && session.test(String(value)))
  })
}

/**
 * Gets how long a shared cache may keep a response, from its headers.
 *
 * It follows `Cache-Control` as a shared cache must:
 *
 * - `private`, `no-store` or `no-cache` forbids storing.
 * - `s-maxage` wins over `max-age`.
 * - Time already spent in a cache in front of Drupal, the `Age` header, is taken off.
 * - No directive means 0.
 *
 * A `Vary` on a request header also forbids storing, because the cache key holds nothing that tells the variants
 * apart. `Cookie`, `X-Consumer-ID`, `Accept-Encoding` and `Origin` are the exceptions.
 *
 * @param headers - The response headers.
 * @returns The seconds the response may be kept. 0 when it may not be kept.
 */
export const parseCacheLifetime = (headers?: unknown): number => {
  // Every key that names the header, whatever its case, joined as a list header is.
  const header = (name: string) => Object.entries(plain(headers))
    .filter(([key]) => key.toLowerCase() === name)
    .map(([, value]) => String(value))
    .join(', ')

  const directives = header('cache-control').toLowerCase().split(',').map((d) => d.trim())
  if (directives.some((d) => ['private', 'no-store', 'no-cache'].includes(d))) return 0

  // The cache is keyed by URL alone. So a response that varies by a header the visitor's browser sends, such as
  // `Accept-Language`, cannot be stored.
  //
  // Four headers tell no variants apart, because the site's own client sends each the same way on every request.
  // Drupal names them on cacheable responses:
  //
  // - `Cookie`: Drupal's own page cache ignores it too when there is no session.
  // - `X-Consumer-ID`: no browser sets it, and it already keys a client's own entries.
  // - `Accept-Encoding`: the decoded document is what is stored.
  // - `Origin`: Drupal's CORS adds it whenever CORS is on. The site's server never sends an `Origin`, so every
  //   answer is the one for no origin.
  const vary = header('vary').toLowerCase().split(',').map((v) => v.trim()).filter(Boolean)
  if (vary.some((v) => !['cookie', 'x-consumer-id', 'accept-encoding', 'origin'].includes(v))) return 0

  const seconds = (name: string) => {
    const directive = directives.find((d) => d.startsWith(`${name}=`))
    // The whole value must be digits. `parseInt` would read 300 from `300abc`.
    const value = directive ? directive.slice(name.length + 1) : ''
    return /^\d+$/.test(value) ? Number(value) : NaN
  }

  // An `s-maxage` that is present but unusable means the response is stale. It does not fall back to `max-age`.
  const lifetime = directives.some((d) => d.startsWith('s-maxage=')) ? seconds('s-maxage') : seconds('max-age')
  if (Number.isNaN(lifetime)) return 0

  // The age comes from the `Age` header alone, never from `Date`. Drupal's own page cache serves a stored response
  // with its original `Date` and no `Age`. An age read from `Date` would leave nothing to keep once that entry is
  // five minutes old.
  const age = parseInt(header('age'), 10) || 0
  return Math.max(0, lifetime - age)
}

// How long each fetched document may be cached, with the time it arrived.
const lifetimes = new WeakMap<object, { seconds: number, at: number }>()

/**
 * Remembers how long a document may be cached, from the headers it arrived with.
 *
 * @param document - A parsed response body. Anything but an object is not remembered.
 * @param headers - The response headers.
 */
export const rememberLifetime = (document: unknown, headers: unknown): void => {
  if (!document || typeof document !== 'object') return
  lifetimes.set(document, { seconds: parseCacheLifetime(headers), at: Date.now() })
}

/**
 * Remembers a document's lifetime as another copy of the document had it.
 *
 * The seconds are counted from when that copy arrived. So a copy read from the process cache reports what is left
 * of its lifetime.
 *
 * @param document - A parsed response body. Anything but an object is not remembered.
 * @param seconds - The seconds the response may be kept.
 * @param at - When the response arrived, in milliseconds.
 */
export const rememberLifetimeFrom = (document: unknown, seconds: number, at: number): void => {
  if (!document || typeof document !== 'object') return
  lifetimes.set(document, { seconds, at })
}

/**
 * Gets how long a remembered document may still be cached.
 *
 * @param document - A document that `rememberLifetime()` saw.
 * @returns The seconds left, counted from when the response arrived. 0 when it may not be cached, or is unknown.
 */
export const lifetimeLeft = (document: unknown): number => {
  if (!document || typeof document !== 'object') return 0
  const record = lifetimes.get(document)
  if (!record) return 0
  return Math.max(0, record.seconds - Math.floor((Date.now() - record.at) / 1000))
}

/**
 * The process cache of one scope, for one request.
 *
 * Ask for a new handle after `clearCache()` or `resetProcessCache()`. A handle kept across a clear still reads what
 * it held, and its writes are dropped.
 */
export interface ProcessCacheHandle {
  /** The generation this handle was taken at. */
  generation: number
  /** The consumer whose entries it reads and writes. Compare a handle taken after a request with one taken before. */
  consumer: string
  /** Reads a value. Undefined when the key holds none, or the entry has expired. */
  get<T = unknown>(key: string): T | undefined
  /** Stores a value for a number of seconds, and returns it whether or not it was stored. */
  set<T>(key: string, value: T, seconds: number, since?: number, started?: number): T
}

export interface ProcessCacheHandleOptions {
  /** Whether the client sends credentials. */
  credentialed?: boolean
  /** What keeps a client's entries apart from another's, such as the headers it sends. Each value keeps its own. */
  consumer?: string
  /** The most seconds an entry may live. It shortens a lifetime and never extends one. 0 keeps nothing. */
  ttl?: number
  /**
   * The most the scope keeps, in bytes of stored JSON, across all its consumers.
   *
   * Past it, expired entries go first, then the scope's least recently used, whichever consumer holds them. A value
   * larger than the whole limit is not stored.
   */
  maxSize?: number
  /** Measures a value for `maxSize`. The bytes of its JSON by default. */
  sizeOf?: (value: unknown) => number
}

/**
 * Gets the process cache for a scope.
 *
 * It returns undefined in a browser, and for a client that sends credentials. So a response built for one user is
 * never stored, and never served to another.
 *
 * Each entry lives for the lifetime it is stored with, which comes from the response's `Cache-Control`.
 *
 * To use a handle safely:
 *
 * - Store a value only after its request has resolved.
 * - Ask for the cache again at that point. The request may have shown that the client sends credentials.
 * - Use a handle for one request. Ask for a new one after a clear. A handle kept across a clear still reads what it
 *   held, and its writes are dropped.
 *
 * @param scope - The cache scope, such as `index`.
 * @param options - The cache options.
 * @param options.credentialed - Whether the client sends credentials.
 * @param options.consumer - What keeps a client's entries apart, such as the headers it sends. Each value keeps its own.
 * @param options.ttl - The most seconds an entry may live. It shortens a lifetime and never extends one. 0 keeps nothing.
 * @param options.maxSize - The most the scope keeps, in bytes of stored JSON, across all its consumers.
 * @param options.sizeOf - Measures a value for `maxSize`. The bytes of its JSON by default.
 * @returns The cache, or undefined when it must not be used.
 */
export const processCache = (
  scope: string,
  { credentialed = false, consumer = '', ttl, maxSize, sizeOf = jsonSize }: ProcessCacheHandleOptions = {},
): ProcessCacheHandle | undefined => {
  if (!runtime.isServer() || credentialed) return undefined

  const consumers = scopeOf(scope)
  const order = consumers[ORDER]!

  // Gets the consumer's entries, and makes the consumer the scope's most recently used. A new consumer past
  // `MAX_PARTITIONS` evicts the least recently used one, with all its entries. A read creates no partition, so a
  // miss leaves none behind.
  const partition = (create: boolean): Entries | undefined => {
    const held = consumers.get(consumer)
    if (!held && !create) return undefined
    const entries: Entries = held || new Map()
    // A Map keeps insertion order. Deleting the consumer and adding it again moves it to the end, which keeps the
    // least recently used consumer first.
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

  // A `ttl` caps how long an entry is kept, so a `ttl` of 0 keeps nothing. Without one, Drupal's lifetime stands.
  const cap = (seconds: number) => (typeof ttl === 'number' ? Math.min(seconds, ttl) : seconds)
  const taken = generation.value

  const expired = (entry: Entry, now = Date.now()) => now - entry.created >= entry.seconds * 1000
  const bounded = typeof maxSize === 'number'

  // Keeps the scope within `maxSize`. Expired entries go first, then the least recently used, whichever consumer
  // holds them.
  //
  // The sweep for expired entries reads every entry. So it runs only once the scope has stored as many values as it
  // holds since the last sweep. A write then costs the same however many entries the scope holds.
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
    // The generation this handle was taken at. Compare a handle taken after a request resolves with one taken
    // before it started. A difference means the cache was cleared while the request was in flight.
    generation: taken,
    consumer,

    // The reader's own `ttl` applies too, so a client with a shorter `ttl` is never served an older entry.
    get<T = unknown>(key: string): T | undefined {
      const entry = partition(false)?.get(key)
      if (!entry) return undefined
      // Past its own lifetime the entry is of no use to any reader, so it is removed.
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
     * Stores a value.
     *
     * The value is not stored when:
     *
     * - A clear has happened since the generation `since`.
     * - The scope was forgotten after the request numbered `started` began.
     * - A request that started later has already stored or removed the entry.
     *
     * A value that may not be kept also removes what an earlier response stored under the key. So the cache follows
     * Drupal's latest answer.
     *
     * With a request number, a removal leaves a trace in the entry's place: the number, with no value. The trace
     * stops an older request from storing its answer there. It counts as the bytes of its key, and is evicted as
     * an entry is.
     *
     * @param key - The cache key.
     * @param value - The value to store.
     * @param seconds - The seconds the value may be kept.
     * @param since - The generation the value was fetched at.
     * @param started - The request's number, from `nextRequest()`.
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
      // a value that is kept makes a partition.
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
 * Gets how many times the process cache has been emptied.
 *
 * Something held beside the cache, such as which menu source a site offers, records this count when it is taken. A
 * count that has moved since means a clear has happened, and the holder lets go.
 *
 * @returns The count, shared by every copy of this module in the process.
 */
export const processCacheGeneration = (): number => generation.value

/**
 * Removes the entries of a scope whose keys pass a test, for every consumer.
 *
 * One use is to remove the responses that held a resource an editor has just saved.
 *
 * The generation does not move. But no answer to a request of the scope that is in flight now is stored, because it
 * may hold what was removed.
 *
 * @param scope - The scope.
 * @param test - Called with each key. It returns true for an entry to remove.
 * @returns How many entries were removed.
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
 * Empties the process cache.
 *
 * @param scope - The scope to empty. Every scope when omitted.
 */
export const resetProcessCache = (scope?: string): void => {
  if (scope) scopes.delete(scope)
  else scopes.clear()
  generation.value += 1
}
