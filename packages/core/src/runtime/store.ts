import { consola } from 'consola'
import { digest } from 'ohash'
import { defineStore } from 'pinia'
import { mergeDeep as merge, omittedResources } from '@druxt/client'
import type { DruxtClient, DruxtClientQuery, JsonApiCollection, JsonApiDocument, JsonApiLinks, JsonApiResource, JsonApiResourceIdentifier } from '@druxt/client'
import type { ResourceError } from './types'
import { getDrupalJsonApiParams } from './utils/getDrupalJsonApiParams'
import { recordRequest, requestKind } from './devel/utils/requests'

/** A query as drupal-jsonapi-params reads it back. */
export interface QueryObject {
  fields?: Record<string, string | undefined>
  include?: string | string[]
  [key: string]: unknown
}

/**
 * A stored resource: the document, with 1.x's cache flags.
 *
 * A resource is stored without Drupal's `links`. They are removed from the document, the resource and its
 * relationships, so no backend URL reaches the payload.
 *
 * - `_druxt_partial` records that it holds only some fields. Its own attribute and relationship keys say which.
 * - `_druxt_full` records that it holds every field.
 */
export interface StoredResource extends Partial<JsonApiDocument<JsonApiResource>> {
  data: JsonApiResource
  links?: JsonApiLinks
  _druxt_full?: number
  _druxt_partial?: number
}

/** A stored collection. Its resources are dehydrated to identifiers, and Drupal's `links` are not kept. */
interface StoredCollection extends Omit<JsonApiCollection, 'data' | 'included'> {
  data: JsonApiResourceIdentifier[]
  included?: JsonApiResourceIdentifier[]
}

/**
 * The druxt store's state.
 *
 * Both trees are keyed by resource type, then by query hash or resource ID, then by prefix.
 */
export interface DruxtState {
  /** JSON:API resource collections, with their resources dehydrated to identifiers. */
  collections: Record<string, Record<string, Record<string, StoredCollection>>>
  /** JSON:API resources. Each is the document it was fetched in. */
  resources: Record<string, Record<string, Record<string, StoredResource>>>
}

// The key of a prefix's slot. A prefix may be undefined, as in 1.x, and an object key turns it into a string anyway.
// This names that slot explicitly.
const slot = (prefix?: string): string => String(prefix)

// A query, in any form the client takes, as a query object.
const readQuery = (query?: DruxtClientQuery | QueryObject): QueryObject =>
  getDrupalJsonApiParams(query).getQueryObject() as QueryObject

/**
 * What a store keeps outside its state.
 *
 * It is kept per store, and so per request. It is kept out of the state so it never reaches the payload.
 */
interface Runtime {
  /** The requests in flight, by key. Callers that ask for the same thing share one. */
  inFlight: Map<string, Promise<unknown>>
  /** The flush generation. Every flush moves it on, so a response a flush overtook is not stored. */
  generation: number
  /**
   * The resources Drupal denied in a response, by prefix and `type:id`.
   *
   * With it, a stored resource's includes are not fetched one by one for resources Drupal already refused. A
   * resource leaves the record when it is stored. The record is emptied when every resource is flushed.
   */
  omitted: Map<string, Set<string>>
  /** The number of the last request this store started, in the order they started in. */
  requests: number
  /**
   * The newest bypass to store each slot, by request number. A response from an earlier request never replaces that
   * bypass's answer.
   */
  bypassed: Map<string, number>
}
const runtime = new WeakMap<object, Runtime>()
const getRuntime = (store: object): Runtime => {
  if (!runtime.has(store)) runtime.set(store, { inFlight: new Map(), generation: 0, omitted: new Map(), requests: 0, bypassed: new Map() })
  return runtime.get(store)!
}

/**
 * Records the resources Drupal denied in a document.
 *
 * The store's own include reads use the record to skip them.
 *
 * @param store - The store.
 * @param meta - The document's `meta`, as the store keeps it.
 * @param prefix - The JSON:API endpoint prefix or langcode.
 */
const noteOmitted = (store: object, meta: Record<string, unknown> | undefined, prefix?: string): void => {
  const resources = (meta?.omitted as { resources?: Array<{ type: string, id?: string }> } | undefined)?.resources
  if (!resources?.length) return
  const { omitted } = getRuntime(store)
  if (!omitted.has(slot(prefix))) omitted.set(slot(prefix), new Set())
  for (const { type, id } of resources) if (id) omitted.get(slot(prefix))!.add(`${type}:${id}`)
}

/**
 * Records a read that the store answered with no request, for the development tools.
 *
 * Development only.
 *
 * @param client - The store's client.
 * @param type - The resource type.
 * @param id - The resource id, for a resource.
 * @param prefix - The language prefix.
 */
const storeHit = (client: DruxtClient | undefined, type: string, id: string | undefined, prefix: string | undefined): void => {
  if (!client) return
  const endpoint = client.options?.endpoint ?? '/jsonapi'
  const path = [prefix ? `/${prefix}` : '', endpoint, '/', type.split('--').join('/'), id ? `/${id}` : ''].join('')
  recordRequest(client, { kind: requestKind(path, endpoint), path, source: 'store' })
}

/**
 * Gets a store's flush generation.
 *
 * A caller reads it before a wait and again after. A different number means a flush overtook the wait.
 *
 * @param store - The store.
 */
export const flushGeneration = (store: object): number => getRuntime(store).generation

// Forgets the requests in flight and the bypass record, and moves the flush generation on.
const flushInFlight = (store: object): void => {
  const state = getRuntime(store)
  state.inFlight.clear()
  state.bypassed.clear()
  state.generation += 1
}

/**
 * Whether a response may be stored for a slot.
 *
 * It may not when a bypass that started after its request has already stored its own answer. A bypass that may be
 * stored becomes the newest for the slot.
 *
 * @param store - The store.
 * @param slotKey - The resource or collection the response is for.
 * @param ticket - The request's number, in the order requests started in.
 * @param bypass - Whether the request was a bypass.
 * @returns Whether to store the response.
 */
const storable = (store: object, slotKey: string, ticket: number, bypass: boolean): boolean => {
  const { bypassed } = getRuntime(store)
  if ((bypassed.get(slotKey) || 0) > ticket) return false
  if (bypass) bypassed.set(slotKey, ticket)
  return true
}

/** The paths an include names. Each is trimmed, and empty ones are left out. */
const includePaths = (include?: string | string[]): string[] =>
  (Array.isArray(include) ? include : String(include || '').split(',')).map((path) => String(path).trim()).filter((path) => path)

/**
 * The relationships of the resource itself that an include reaches.
 *
 * A nested path includes every relationship along it, so `media.image` names `media` too.
 *
 * @param include - The include.
 * @returns The first relationship of each path, once each.
 */
export const topIncludes = (include?: string | string[]): string[] => Array.from(new Set(includePaths(include).map((path) => path.split('.')[0]!)))

/**
 * The include paths below one relationship, relative to it.
 *
 * `media,media.image,media.image.file` below `media` is `image,image.file`.
 *
 * @param include - The include.
 * @param key - The relationship.
 * @returns The paths, comma-separated.
 */
export const subIncludes = (include: string | string[] | undefined, key: string): string =>
  includePaths(include).filter((path) => path.startsWith(`${key}.`)).map((path) => path.slice(key.length + 1)).join(',')

/**
 * A type's sparse fieldset, with the relationships an include names added.
 *
 * Drupal leaves a relationship out of the document when the fieldset doesn't name it, so an include needs its
 * relationship in the fieldset.
 *
 * @param fields - The type's comma-separated fieldset.
 * @param include - The include.
 * @returns The fieldset, comma-separated.
 */
export const fieldsWithIncludes = (fields: string, include?: string | string[]): string =>
  Array.from(new Set([...String(fields).split(','), ...topIncludes(include)])).filter((field) => field).join(',')

/**
 * The include paths a resource's type can take.
 *
 * Drupal answers 400 to an include a type lacks. One relationship can hold several types, such as paragraphs, and
 * each takes only the includes its type has.
 *
 * When a query lists a type's fields, a path is left out when those fields don't name its relationship. It is kept
 * when the resource is known to have that relationship.
 *
 * @param include - The include.
 * @param fields - The type's comma-separated fieldset. Without one, the include is kept whole.
 * @param relationships - Relationships the resource is known to have.
 * @returns The paths kept, comma-separated.
 */
export const includesFor = (include: string, fields: string | undefined, relationships: string[] = []): string => {
  if (!include || typeof fields !== 'string') return include
  const listed = fields.split(',')
  return includePaths(include).filter((path) => {
    const key = path.split('.')[0]!
    return listed.includes(key) || relationships.includes(key)
  }).join(',')
}

// Runs a request once per key while it is in flight. Callers with the same key get the same promise.
const share = <T>(store: object, key: string, request: () => Promise<T>): Promise<T> => {
  const { inFlight } = getRuntime(store)
  if (!inFlight.has(key)) {
    const promise = request()
    const clear = () => { if (inFlight.get(key) === promise) inFlight.delete(key) }
    inFlight.set(key, promise)
    promise.then(clear, clear)
  }
  return inFlight.get(key) as Promise<T>
}

/** The query a document was fetched with, read from its own self link. */
const queryOf = (document?: { links?: JsonApiLinks }): QueryObject => readQuery(decodeURI(document?.links?.self?.href || '').split('?')[1] || '')

/** Whether a query asked for only some of a type's fields. */
const sparse = (query: QueryObject, type: string): boolean => typeof query.fields?.[type] === 'string'

/**
 * A resource without Drupal's links.
 *
 * Its own links and each relationship's links are removed. Nothing else is changed.
 *
 * @param data - The resource.
 */
const withoutLinks = (data: JsonApiResource): JsonApiResource => {
   
  const { links: _links, ...rest } = data
  if (!rest.relationships) return rest
  return {
    ...rest,
    relationships: Object.fromEntries(Object.entries(rest.relationships).map(([key, relationship]) => {
       
      const { links: _related, ...kept } = (relationship || {}) as { links?: unknown }
      return [key, kept]
    })) as JsonApiResource['relationships'],
  }
}

/**
 * A document's `meta` as the store keeps it.
 *
 * What Drupal omitted becomes its reason and the omitted types and ids. The links that name the backend are not
 * kept.
 *
 * @param document - The document.
 * @param endpoint - The client's JSON:API path, which the omitted links name. `/jsonapi` when not set.
 */
const storedMeta = (document: { meta?: Record<string, unknown> }, endpoint?: string): Record<string, unknown> | undefined => {
  if (!document.meta) return undefined
  const omitted = omittedResources(document, endpoint)
  return omitted ? { ...document.meta, omitted } : document.meta
}

/**
 * Whether an included resource holds only some of its type's fields.
 *
 * An included resource, at any depth, holds every field, whatever a self link's query says. The one exception is
 * when the store's own request asked for only some of its type's fields. Only the store knows the request it made.
 *
 * @param query - The query the store fetched with, when it did.
 * @returns A function that takes a type and says whether its included resources are partial.
 */
const includedPartial = (query?: DruxtClientQuery | QueryObject): ((type: string) => boolean) => {
  if (query === undefined) return () => false
  const queryObject = readQuery(query)
  return (type) => sparse(queryObject, type)
}

/**
 * Stores resources and returns their identifiers.
 *
 * @param store - The store.
 * @param resources - The resources.
 * @param partial - Whether a resource holds only some of its fields, by its type.
 * @param prefix - The JSON:API endpoint prefix or langcode.
 */
const dehydrateResources = (store: { addResource: (payload: { prefix?: string, resource: StoredResource, partial?: boolean }) => void }, resources: JsonApiResource[] | undefined, partial: (type: string) => boolean, prefix?: string): JsonApiResourceIdentifier[] =>
  (resources || []).map((data) => {
    store.addResource({ prefix, resource: { data }, partial: partial(data.type) })
    return { id: data.id, type: data.type }
  })

// The key a collection is stored under: its query without the fields and includes.
const collectionHash = (query?: DruxtClientQuery): string => {
  if (!query) return '_default'
  return digest(JSON.stringify({ ...readQuery(query), fields: {}, include: [] }))
}

// Removes the entries a flush names from a keyed tree. It removes nothing when they were never stored.
//
// With no keys and no leaf, the whole of `key` goes. With a leaf, only that leaf goes, from the named keys or from
// every key.
const flush = (tree: Record<string, Record<string, Record<string, unknown>>>, key: string, keys: string[], leaf?: string): void => {
  const byKey = tree[key]
  if (!byKey) return
  if (!keys.length && leaf === undefined) {
    delete tree[key]
    return
  }
  for (const k of keys.length ? keys : Object.keys(byKey)) {
    const entry = byKey[k]
    if (!entry) continue
    if (leaf !== undefined) delete entry[leaf]
    else delete byKey[k]
  }
}

/**
 * The druxt Pinia store, ported from 1.x's Vuex module.
 *
 * 1.x's mutations are actions here. The behaviour is 1.x's, including in-flight sharing and the flush generation
 * guard.
 *
 * @example <caption>Usage in a Nuxt app</caption> @lang js
 * import { useDruxtStore } from '@druxt/core/store'
 * const store = useDruxtStore()
 */
export const useDruxtStore = defineStore('druxt', {
  state: (): DruxtState => ({
    collections: {},
    resources: {},
  }),

  actions: {
    /**
     * Empties the client's caches and the Druxt stores, as 1.x's `druxt/clearCache` did.
     *
     * The edit store's drafts are unsaved edits, not cache, so they stay unless `drafts` is set. A sign-in and a
     * sign-out set it, so one user's edits never reach the next.
     *
     * @param options - What to empty beside the caches.
     * @param options.drafts - Whether to close the edit store's drafts too.
     *
     * @example @lang js
     * useDruxtStore(this.$pinia).clearCache()
     *
     * @example <caption>With the drafts, as a sign-out does</caption> @lang js
     * useDruxtStore(this.$pinia).clearCache({ drafts: true })
     */
    clearCache({ drafts = false }: { drafts?: boolean } = {}): void {
      if (typeof this.$druxt?.clearCache === 'function') this.$druxt.clearCache()
      this.flushCollection({})
      this.flushResource({})
      // The other modules' stores are flushed only where they exist. `_s` is Pinia's internal registry.
      const registry = (this as unknown as { _p?: { _s: Map<string, Record<string, (payload: object) => void>> } })._p?._s
      // The edit store's drafts are closed only when asked, as a sign-in or a sign-out asks.
      const stores = [['druxtViews', 'flushResults'], ['druxtMenu', 'flush'], ['druxtRouter', 'flushRoutes'], ['druxtSchema', 'flushSchemas'], ...(drafts ? [['druxtEdit', 'closeAll']] : [])] as const
      for (const [id, name] of stores) {
        const store = registry?.get(id)
        if (store) store[name]!({})
      }
    },

    /**
     * Adds a JSON:API collection to the store.
     *
     * @param payload - The action payload.
     * @param payload.collection - A collection of JSON:API resources.
     * @param payload.type - The JSON:API collection resource type.
     * @param payload.hash - The key the collection is stored under: a hash of its query, or `_default`.
     * @param payload.prefix - The JSON:API endpoint prefix or langcode.
     * @param payload.partial - Whether its resources hold only some of their fields, such as a view's rows, whatever
     *   their self links say. Its included resources hold every field, at any depth, unless `query` asked for only
     *   some.
     * @param payload.query - The query it was fetched with, in place of its self link's.
     *
     * @example @lang js
     * useDruxtStore(this.$pinia).addCollection({ collection, type, hash })
     *
     * @example <caption>The payload</caption> @lang js
     * {
     *   collection: {
     *     jsonapi: {},
     *     data: [{}],
     *     links: {}
     *   },
     *   type: 'node--page',
     *   hash: '_default',
     *   prefix: 'en'
     * }
     */
    addCollection({ collection, type, hash, prefix, partial, query }: { collection: JsonApiCollection, type: string, hash: string, prefix?: string, partial?: boolean, query?: DruxtClientQuery | QueryObject }): void {
      const byType = this.collections[type] || (this.collections[type] = {})
      const byHash = byType[hash] || (byType[hash] = {})

      // The query it was fetched with. It is given, or read from the self link now, because the links are not kept.
      const queryObject = query !== undefined ? readQuery(query) : queryOf(collection)
      // Drupal's links are not kept. Nor is the JSON:API version object, which links to the specification.
       
      const { links: _links, jsonapi: _jsonapi, ...rest } = collection as JsonApiCollection & { jsonapi?: unknown }

      const meta = storedMeta(collection as { meta?: Record<string, unknown> }, this.$druxt?.options?.endpoint)
      noteOmitted(this, meta, prefix)
      const dehydrated: StoredCollection = {
        ...rest,
        ...(meta ? { meta } : {}),
        // Its rows are partial when `partial` says so, or else when the query asked for only some of their fields.
        data: dehydrateResources(this, collection.data, (t) => partial ?? sparse(queryObject, t), prefix),
        included: collection.included ? dehydrateResources(this, collection.included, includedPartial(query), prefix) : undefined,
      }

      const hadIncluded = !!collection.included
      const merged = merge(byHash[slot(prefix)] || {}, dehydrated)
      if (!hadIncluded) delete merged.included
      byHash[slot(prefix)] = merged
    },

    /**
     * Adds a JSON:API resource to the store.
     *
     * @param payload - The action payload.
     * @param payload.prefix - The JSON:API endpoint prefix or langcode.
     * @param payload.resource - The JSON:API resource document.
     * @param payload.partial - Whether it holds only some of its fields, such as a view's row, whatever its self link
     *   says. Its own attribute and relationship keys record which fields.
     * @param payload.query - The query it was fetched with, in place of its self link's.
     *
     * @example @lang js
     * useDruxtStore(this.$pinia).addResource({ resource })
     *
     * @example <caption>A view's row, which holds only the fields the view selected</caption> @lang js
     * useDruxtStore(this.$pinia).addResource({ resource: { data: row }, partial: true })
     *
     * @example <caption>The payload</caption> @lang js
     * {
     *   prefix: 'en',
     *   resource: {
     *     jsonapi: {},
     *     data: {},
     *     links: {}
     *   },
     * }
     */
    addResource({ prefix, resource, partial, query }: { prefix?: string, resource: StoredResource, partial?: boolean, query?: DruxtClientQuery | QueryObject }): void {
      const { id, type } = resource?.data || {}
      if (!id || !type) return

      // Partial or full is decided now, because the links are not kept. `partial` decides when given, then the query
      // it was fetched with, then its self link. Its own attribute and relationship keys record the fields it holds.
      const queryObject = query !== undefined ? readQuery(query) : queryOf(resource)
      const flag = (partial ?? sparse(queryObject, type)) ? '_druxt_partial' : '_druxt_full'

      const byType = this.resources[type] || (this.resources[type] = {})
      const byId = byType[id] || (byType[id] = {})

      if (resource.included) dehydrateResources(this, resource.included, includedPartial(query), prefix)

      // Drupal has returned the resource, so it is no longer denied.
      getRuntime(this).omitted.get(slot(prefix))?.delete(`${type}:${id}`)
      const meta = resource.meta ? storedMeta(resource as { meta?: Record<string, unknown> }, this.$druxt?.options?.endpoint) : undefined
      noteOmitted(this, meta, prefix)
      const stored: StoredResource = {
        data: withoutLinks(resource.data),
        ...(meta ? { meta } : {}),
        [flag]: Date.now(),
      }
      byId[slot(prefix)] = merge(byId[slot(prefix)] || {}, stored)
    },

    /**
     * Removes JSON:API collections from the store.
     *
     * @param payload - What to flush. Every collection when empty.
     * @param payload.type - The JSON:API collection resource type. Every collection when omitted.
     * @param payload.hash - The stored key of one query, in place of `query`.
     * @param payload.query - The query the collection was fetched with.
     * @param payload.prefix - The JSON:API endpoint prefix or langcode. Every prefix when omitted.
     *
     * @example @lang js
     * // Flush all collections.
     * useDruxtStore(this.$pinia).flushCollection({})
     *
     * // Flush target collection, by the query it was fetched with.
     * useDruxtStore(this.$pinia).flushCollection({ type, query, prefix })
     *
     * // Flush every collection of a type in one language.
     * useDruxtStore(this.$pinia).flushCollection({ type, prefix })
     *
     * @example <caption>The payload</caption> @lang js
     * {
     *   type: 'node--page',
     *   query: new DrupalJsonApiParams().addFilter('status', '1'),
     *   prefix: 'en'
     * }
     */
    flushCollection({ type, hash, query, prefix }: { type?: string, hash?: string, query?: DruxtClientQuery, prefix?: string } = {}): void {
      flushInFlight(this)
      if (!type) {
        this.collections = {}
        return
      }
      const key = hash !== undefined ? hash : (query !== undefined ? collectionHash(query) : undefined)
      flush(this.collections, type, key !== undefined ? [key] : [], prefix === undefined ? undefined : slot(prefix))
    },

    /**
     * Removes JSON:API resources from the store.
     *
     * @param payload - What to flush. Every resource when empty.
     * @param payload.type - The JSON:API resource type. Every resource when omitted.
     * @param payload.id - The Drupal resource UUID. Every resource of the type when omitted.
     * @param payload.prefix - The JSON:API endpoint prefix or langcode. Every prefix when omitted.
     *
     * @example @lang js
     * // Flush all resources.
     * useDruxtStore(this.$pinia).flushResource({})
     *
     * // Flush target resource.
     * useDruxtStore(this.$pinia).flushResource({ id, type, prefix })
     *
     * @example <caption>The payload</caption> @lang js
     * {
     *   type: 'node--page',
     *   id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
     *   prefix: 'en'
     * }
     */
    flushResource({ type, id, prefix }: { type?: string, id?: string, prefix?: string } = {}): void {
      flushInFlight(this)
      if (!type) {
        this.resources = {}
        // The record of what Drupal denied goes with every resource, because Drupal may have granted access since.
        // A flush of only some resources keeps the record, so a denied include is not asked for again on every read.
        getRuntime(this).omitted.clear()
        return
      }
      flush(this.resources, type, id !== undefined ? [id] : [], prefix === undefined ? undefined : slot(prefix))
    },

    /**
     * Gets a collection of resources.
     *
     * The store answers when it holds the collection and every resource in it. Otherwise the collection is fetched
     * and stored.
     *
     * @param payload - The action parameters.
     * @param payload.type - The JSON:API collection resource type.
     * @param payload.query - A correctly formatted JSON:API query string or object.
     * @param payload.prefix - The JSON:API endpoint prefix or langcode.
     * @param payload.bypassCache - Bypass the stored collection and fetch it again.
     * @returns The JSON:API collection document.
     *
     * @example @lang js
     * // Load all currently published Articles.
     * const collection = await useDruxtStore(this.$pinia).getCollection({
     *   type: 'node--article',
     *   query: new DrupalJsonApiParams().addFilter('status', '1'),
     *   bypassCache: false
     * })
     *
     * @example <caption>The payload</caption> @lang js
     * {
     *   type: 'node--page',
     *   query: new DrupalJsonApiParams().addFilter('status', '1'),
     *   bypassCache: false
     * }
     */
    async getCollection({ type, query, prefix, bypassCache = false }: { type: string, query?: DruxtClientQuery, prefix?: string, bypassCache?: boolean }): Promise<JsonApiCollection> {
      const hash = collectionHash(query)

      const cached = this.collections[type]?.[hash]?.[slot(prefix)]
      if (!bypassCache && cached) {
        const hydrate = (o: JsonApiResourceIdentifier) => this.resources[o.type]?.[o.id]?.[slot(prefix)]?.data
        const data = cached.data.map(hydrate)
        const included = cached.included ? cached.included.map(hydrate) : undefined
        if (data.every((o) => o) && (included || []).every((o) => o)) {
          if (import.meta.dev) storeHit(this.$druxt, type, undefined, prefix)
          return { ...cached, data: data as JsonApiResource[], ...(included ? { included: included as JsonApiResource[] } : {}) }
        }
      }

      // A bypass is its own request and never joins one in flight. It skips the server's process cache too.
      const key = JSON.stringify(['collection', prefix, type, hash, readQuery(query), bypassCache])
      return share(this, key, async () => {
        const runtime = getRuntime(this)
        const since = runtime.generation
        const ticket = ++runtime.requests
        const collection = await this.$druxt.getCollection(type, query, prefix, { bypassCache }) as JsonApiCollection
        if (since === getRuntime(this).generation && storable(this, JSON.stringify(['collection', type, hash, prefix]), ticket, bypassCache)) {
          this.addCollection({ collection: { ...collection }, type, hash, prefix, query })
        }
        return collection
      })
    },

    /**
     * Reads the resource the store holds for a type, id and prefix, with no request.
     *
     * It is synchronous, so a render can read it. It returns the resource itself, not its document. The store may
     * hold only some of its fields.
     *
     * @param payload - What to read.
     * @param payload.type - The JSON:API resource type.
     * @param payload.id - The Drupal resource UUID.
     * @param payload.prefix - The JSON:API endpoint prefix or langcode.
     * @returns The resource, or undefined when the store holds none.
     *
     * @example @lang js
     * const author = useDruxtStore().peekResource({ type: 'user--user', id, prefix: 'en' })
     */
    peekResource({ type, id, prefix }: { type: string, id: string, prefix?: string }): JsonApiResource | undefined {
      return this.resources[type]?.[id]?.[slot(prefix)]?.data as JsonApiResource | undefined
    },

    /**
     * Reads the `meta` of the document the store holds a resource from, with no request.
     *
     * One example is `omitted`, the resources Drupal left out of the document. It is stored without the links that
     * name the backend.
     *
     * @param payload - What to read.
     * @param payload.type - The JSON:API resource type.
     * @param payload.id - The Drupal resource UUID.
     * @param payload.prefix - The JSON:API endpoint prefix or langcode.
     * @returns The `meta`, or undefined when the store holds none.
     *
     * @example @lang js
     * const denied = useDruxtStore().peekMeta({ type: 'node--recipe', id, prefix: 'en' })?.omitted?.resources
     */
    peekMeta({ type, id, prefix }: { type: string, id: string, prefix?: string }): Record<string, unknown> | undefined {
      return this.resources[type]?.[id]?.[slot(prefix)]?.meta as Record<string, unknown> | undefined
    },

    /**
     * Reads every resource of a type the store holds, with no request.
     *
     * Each is read from the given prefix, or else from the first prefix the store holds it under.
     *
     * @param payload - What to read.
     * @param payload.type - The JSON:API resource type.
     * @param payload.prefix - The JSON:API endpoint prefix or langcode.
     *
     * @example @lang js
     * const languages = useDruxtStore().peekResources({ type: 'configurable_language--configurable_language', prefix: 'en' })
     */
    peekResources({ type, prefix }: { type: string, prefix?: string }): JsonApiResource[] {
      return Object.values(this.resources[type] || {})
        .map((byPrefix) => (byPrefix[slot(prefix)] || Object.values(byPrefix)[0])?.data as JsonApiResource | undefined)
        .filter((resource): resource is JsonApiResource => !!resource)
    },

    /**
     * Gets a JSON:API resource, from the store when it holds every field asked for.
     *
     * Requests in flight:
     *
     * - A request in flight for the same resource with the same query is shared.
     * - A request in flight for the same resource with another query is waited for first, so the store can answer
     *   from what it stores. It is not waited for when the store already answers.
     *
     * A failed request is not thrown and not stored. The result carries it as `error`, beside whatever the store
     * already held:
     *
     * - The error's `message` is the HTTP status text. It has no URL or detail. Those are logged in development.
     * - A network or other failure with no HTTP status reports 500.
     * - With `bypassCache`, a failed refresh returns the previously stored `data` beside `error`.
     *
     * @param payload - The action parameters.
     * @param payload.type - The JSON:API resource type.
     * @param payload.id - The Drupal resource UUID.
     * @param payload.query - A correctly formatted JSON:API query string or object.
     * @param payload.prefix - The JSON:API endpoint prefix or langcode.
     * @param payload.bypassCache - Bypass the stored resource and fetch it again.
     * @returns The full JSON:API document. The resource is its `data`, such as `resource.data.attributes`.
     * @throws A `TypeError` on an empty type or id, as the client does.
     *
     * @example @lang js
     * const resource = await useDruxtStore(this.$pinia).getResource({
     *   type: 'node--article',
     *   id,
     *   bypassCache: false
     * })
     *
     * @example <caption>The payload</caption> @lang js
     * {
     *   type: 'node--page',
     *   id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
     *   prefix: 'en',
     *   bypassCache: false
     * }
     */
    async getResource({ type, id, query, prefix, bypassCache = false }: { type: string, id: string, query?: DruxtClientQuery | QueryObject, prefix?: string, bypassCache?: boolean }): Promise<Partial<StoredResource> & { error?: ResourceError }> {
      if (!type) throw new TypeError('getResource() needs a type')
      if (!id) throw new TypeError('getResource() needs an id')
      const queryObject = readQuery(query)
      queryObject.include = Array.isArray(queryObject.include)
        ? queryObject.include.join(',')
        : queryObject.include
      const include = queryObject.include as string | undefined
      const fieldsFor = queryObject.fields?.[type]

      // The fieldset must name each included relationship. A nested path names its first relationship too.
      if (include && typeof fieldsFor === 'string') queryObject.fields![type] = fieldsWithIncludes(fieldsFor, include)

      // A request in flight for this resource with another query is waited for. A second reader of the same entity,
      // such as a standalone field beside its DruxtEntity, is then answered from what that request stores.
      //
      // There is no wait when the store already answers. There is none for the same query either: that request is
      // shared below as one request, its failure included.
      if (!bypassCache) {
        const held = this.resources[type]?.[id]?.[slot(prefix)]
        const asked = queryObject.fields?.[type]
        const holds = (key: string) => key in (held?.data.attributes || {}) || key in (held?.data.relationships || {})
        const answered = !!held && (!!held._druxt_full || (typeof asked === 'string' && asked.split(',').filter(Boolean).every(holds)))
        const { inFlight } = getRuntime(this)
        const same = JSON.stringify(['resource', prefix, type, id, queryObject, false])
        if (!answered && !inFlight.has(same)) {
          const resourceKey = JSON.stringify(['resource', prefix, type, id]).slice(0, -1) + ','
          const pending = [...inFlight].filter(([key]) => key.startsWith(resourceKey)).map(([, request]) => request)
          if (pending.length) await Promise.allSettled(pending)
        }
      }
      const existing = this.resources[type]?.[id]?.[slot(prefix)]
      let storedResource: StoredResource | null = existing ? { ...existing } : null

      // The sub-includes a related resource can take. One relationship can hold several types, such as paragraphs,
      // and each takes only the includes its type has. The stored copy shows the relationships it has. A related
      // resource that was flushed has no stored copy, so its listed fields decide alone.
      const includeFor = (related: JsonApiResourceIdentifier, nested: string): string => {
        const held = this.resources[related.type]?.[related.id]?.[slot(prefix)]
        const relationships = Object.keys(held?.data.relationships || {})
        return includesFor(nested, queryObject.fields?.[related.type], relationships)
      }

      // The included resources are gathered through `getResource()`, by the include query. A bypass takes its
      // includes from the fresh response instead.
      let included: JsonApiResource[] = []
      if (include && storedResource && !bypassCache) {
        const relationships = storedResource.data.relationships || {}
        const resources = await Promise.all(topIncludes(include)
          .filter((s) => Object.keys(relationships).includes(s))
          .map((key) => {
            const related = relationships[key]!.data
            const items = Array.isArray(related) ? related : [related]
            const nested = subIncludes(include, key)
            // Skipped: a resource Drupal already denied, and one Drupal gives no entity for.
            // A restored store has no record of the denials, so the parent's own list counts too, for a resource the
            // store does not hold.
            const denied = getRuntime(this).omitted.get(slot(prefix))
            const listed = new Set(((storedResource?.meta?.omitted as { resources?: Array<{ type: string, id?: string }> } | undefined)?.resources || []).map((o) => `${o.type}:${o.id}`))
            const skipped = (o: JsonApiResourceIdentifier) => denied?.has(`${o.type}:${o.id}`) || (listed.has(`${o.type}:${o.id}`) && !this.resources[o.type]?.[o.id]?.[slot(prefix)])
            return items.filter((o): o is JsonApiResourceIdentifier => typeof o === 'object' && !!o && o.id !== 'missing' && o.id !== 'virtual' && !skipped(o)).map((o) => this.getResource({
              id: o.id,
              prefix,
              type: o.type,
              query: { ...queryObject, include: includeFor(o, nested) },
            }))
          })
          .flat())
        for (const result of resources) {
          if (result.data) included = [...included, result.data, ...result.included || []]
        }
        // Drupal leaves `included` out of a document that includes nothing, and so does a read from the store.
        if (included.length) storedResource.included = included
        // A flush during that wait emptied the store. The copy then shows fields the store no longer holds, so the
        // read goes on as one of a resource that is not stored, and asks for every field.
        if (!this.resources[type]?.[id]?.[slot(prefix)]) storedResource = null
      }

      if (!bypassCache && storedResource?._druxt_full) {
        if (import.meta.dev) storeHit(this.$druxt, type, id, prefix)
        return storedResource
      }

      // With a sparse fieldset, only the fields the store does not hold are asked for.
      const currentFields = queryObject.fields?.[type]
      const isFull = typeof currentFields !== 'string'
      let fields: boolean | string | undefined = isFull ? true : currentFields
      if (storedResource && !isFull && fields && !bypassCache) {
        const queryFields = String(fields).split(',')
        const resourceFields = [
          ...Object.keys(storedResource.data.attributes || {}),
          ...Object.keys(storedResource.data.relationships || {}),
        ]
        const missingFields = queryFields.filter((key) => !resourceFields.includes(key))
        fields = !!missingFields.length
        queryObject.fields![type] = missingFields.join(',') || undefined
      }

      let resource: JsonApiDocument<JsonApiResource> | undefined
      let error: ResourceError | undefined
      const since = getRuntime(this).generation
      if (import.meta.dev && !(bypassCache || !storedResource || fields)) storeHit(this.$druxt, type, id, prefix)
      if (bypassCache || !storedResource || fields) {
        try {
          // A bypass is its own request and never joins one in flight.
          const key = JSON.stringify(['resource', prefix, type, id, queryObject, bypassCache])
          resource = await share(this, key, async () => {
            const runtime = getRuntime(this)
            const started = runtime.generation
            const ticket = ++runtime.requests
            // A bypass also skips the server's process cache.
            const response = await this.$druxt.getResource(type, id, getDrupalJsonApiParams(queryObject), prefix, { bypassCache })
            // Stored unless a flush happened meanwhile, or a bypass that started later has already stored its answer.
            if (started === getRuntime(this).generation && storable(this, JSON.stringify(['resource', type, id, prefix]), ticket, bypassCache)) {
              this.addResource({ prefix, resource: { ...response }, query: queryObject })
            }
            return response
          })
        } catch (caught) {
          const failure = caught as { message?: string, response?: { status?: number, statusText?: string } }
          // The client's message names the backend URL and Drupal's detail. Only the status line reaches the result.
          error = { statusCode: failure.response?.status ?? 500, message: failure.response?.statusText || 'Request failed', ...(failure.response ? {} : { network: true }) }
          if (import.meta.dev) consola.withTag('DruxtStore').warn(`getResource(${type}, ${id}) failed:`, failure.message)
        }
      }

      const stored = this.resources[type]?.[id]?.[slot(prefix)]
      // A read that a flush overtook is not stored. It is shaped as the store would hold it, without links.
      const fresh = resource?.data ? { data: withoutLinks(resource.data), ...(resource.meta ? { meta: storedMeta(resource as { meta?: Record<string, unknown> }, this.$druxt?.options?.endpoint) } : {}) } : undefined
      const result: Partial<StoredResource> & { error?: ResourceError } = { ...(since === getRuntime(this).generation && stored ? stored : fresh ?? stored) }

      if (include && (resource?.included?.length || storedResource?.included?.length)) {
        included = [
          ...resource?.included || [],
          ...storedResource?.included || [],
        ]
        // Each is returned as the store holds it, without links, so a fresh read and a stored read have one shape.
        // A read that a flush overtook stored nothing. Its includes are its own, not what a later read stored.
        const overtaken = since !== getRuntime(this).generation
        // Each is told apart by its type and id. Two types can share an id that a client supplied.
        const named = new Map(included.filter((o) => o?.id).reverse().map((o) => [`${o.type}:${o.id}`, o]))
        result.included = Array.from(new Set(included.filter((o) => o?.id).map((o) => `${o.type}:${o.id}`)))
          .map((key) => named.get(key)!)
          .map((o) => (overtaken ? undefined : this.resources[o.type]?.[o.id]?.[slot(prefix)]?.data as JsonApiResource | undefined) ?? withoutLinks(o))
      }

      if (error) result.error = error

      return result
    },
  },
})
