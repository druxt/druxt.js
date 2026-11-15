import type { Storage } from 'unstorage'

/** What a config hold takes. */
export interface DruxtConfigHoldOptions<T> {
  /** Nitro storage, memory or a driver a site shares across instances. */
  storage: Storage
  /** The build this hold serves: a new deploy never reads an old one's values. */
  buildId: string
  /** The hold's name, the first part of its storage keys, such as `date-formats`. Two holds on one storage need two names. */
  name: string
  /** Reads the value for a key, such as a language prefix, through the server's client. */
  read: (key: string) => Promise<DruxtConfigRead<T>>
  /** Seconds a failed read stands for its key, so renders in between do not read Drupal again. None when not set. */
  failureMaxAge?: number
}

/** A read of a value, and how long to hold it: until a clear, or `maxAge` seconds. */
export interface DruxtConfigRead<T> {
  value: T
  /** Seconds to hold a read that stood in for a failed one, such as an anonymous read after a failed sign-in. */
  maxAge?: number
}

/** A held read. */
interface Held<T> {
  value: T
  /** When it expires, in milliseconds, or none until a clear. */
  expires?: number
}

/** Site configuration read from Drupal, held for the process, by key. */
export interface DruxtConfigHold<T> {
  /**
   * The value for a key: the held one, else read once and held. A read with a `maxAge` is held only for that long, and
   * a failure stands for `failureMaxAge`.
   */
  get(key?: string): Promise<T>
  /** Drops every value this hold keeps, for every build, so the next render reads them again. */
  clear(): Promise<void>
}

/**
 * Holds site configuration read from Drupal once per build and key, so a server render reads it from storage, not
 * from Drupal. It suits what is the same for every visitor, such as Drupal's date formats or a theme's block
 * placements, so a read through the build's credentials is held for everyone. Concurrent reads of one key share a
 * request, and a read that spans a clear is handed to its callers but not held. A failed read stands for
 * `failureMaxAge` seconds, so a failing Drupal is not read again on every render. Each value is stored under
 * `<name>:<buildId>:<key>`, with `-` for an empty key, and a clear removes every key under `<name>:`. A read of
 * `undefined` is held, and answered, as `null`. Each consumer clears its hold on the `druxt:cache:clear` Nitro hook,
 * as entity's server plugin does for its date formats.
 *
 * @param options - The storage, the build, the hold's name and the reader.
 *
 * @example @lang ts
 * import { useStorage } from 'nitropack/runtime'
 * import { createDruxtConfigHold } from '@druxt/core/server'
 *
 * const hold = createDruxtConfigHold<JsonApiResource[]>({
 *   storage: useStorage('druxt'),
 *   buildId: useRuntimeConfig().app.buildId,
 *   name: 'date-formats',
 *   read: async (prefix) => ({ value: await readFormats(prefix) }),
 * })
 * const formats = await hold.get('es')
 */
export const createDruxtConfigHold = <T>({ storage, buildId, name, read, failureMaxAge = 0 }: DruxtConfigHoldOptions<T>): DruxtConfigHold<T> => {
  // A colon or a slash would join another hold's keys, as unstorage drivers read both as separators.
  if (!name || /[:/]/.test(name)) throw new TypeError(`[druxt] createDruxtConfigHold() needs a name with no colon or slash, such as 'date-formats', not '${name}'.`)
  const storageKey = (key: string) => `${name}:${buildId}:${key || '-'}`
  // Moved on by each clear here, so a read started before it is not held.
  let generation = 0
  const pending = new Map<string, Promise<T>>()
  // Each key's last failed read and when it stops standing, in this process.
  const failures = new Map<string, { error: unknown, until: number }>()

  const fetch = async (key: string, since: number): Promise<T> => {
    const held = await storage.getItem<Held<T>>(storageKey(key))
    if (held && typeof held === 'object' && 'value' in held && (held.expires === undefined || held.expires > Date.now())) return held.value
    const failed = failures.get(key)
    if (failed && failed.until > Date.now()) throw failed.error
    let result: DruxtConfigRead<T>
    try {
      result = await read(key)
    } catch (error) {
      if (failureMaxAge && since === generation) failures.set(key, { error, until: Date.now() + failureMaxAge * 1000 })
      throw error
    }
    failures.delete(key)
    const { maxAge } = result
    // Held as null when undefined, so a JSON driver keeps the key and the entry counts as held.
    const value = (result.value === undefined ? null : result.value) as T
    if (since === generation) await storage.setItem<Held<T>>(storageKey(key), { value, ...(maxAge ? { expires: Date.now() + maxAge * 1000 } : {}) })
    return value
  }

  return {
    get(key = '') {
      if (!pending.has(key)) {
        const request = fetch(key, generation).finally(() => {
          if (pending.get(key) === request) pending.delete(key)
        })
        pending.set(key, request)
      }
      return pending.get(key)!
    },
    async clear() {
      generation += 1
      pending.clear()
      failures.clear()
      // Every build's: a driver may ignore the base, so only this hold's keys are removed.
      const keys = await storage.getKeys(`${name}:`)
      await Promise.all(keys.map((k) => storage.removeItem(k)))
    },
  }
}
