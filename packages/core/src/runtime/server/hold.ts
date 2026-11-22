import type { Storage } from 'unstorage'

/** What a config hold takes. */
export interface DruxtConfigHoldOptions<T> {
  /** Nitro storage: memory, or a driver a site shares across instances. */
  storage: Storage
  /** The build this hold serves. A new deploy never reads an old deploy's values. */
  buildId: string
  /**
   * The hold's name, such as `date-formats`. It is the first part of its storage keys.
   *
   * Two holds on one storage need two names.
   */
  name: string
  /** Reads the value for a key, such as a language prefix, through the server's client. */
  read: (key: string) => Promise<DruxtConfigRead<T>>
  /**
   * The seconds a failed read stands for its key. Renders in that time do not read Drupal again.
   *
   * A failure does not stand when this is not set.
   */
  failureMaxAge?: number
}

/**
 * A value as a hold answers it.
 *
 * A read of `undefined` is held, and answered, as `null`. Any other value is answered as it was read.
 */
export type DruxtHeld<T> = undefined extends T ? Exclude<T, undefined> | null : T

/** A read of a value, and how long to hold it: until a clear, or for `maxAge` seconds. */
export interface DruxtConfigRead<T> {
  value: T
  /**
   * The seconds to hold the value. Without it, the value is held until a clear.
   *
   * It suits a read that stood in for a failed one, such as an anonymous read after a failed sign-in.
   */
  maxAge?: number
}

/** A held read. */
interface Held<T> {
  value: T
  /** When it expires, in milliseconds. Not set for a value held until a clear. */
  expires?: number
}

/** Site configuration read from Drupal, held for the process, by key. */
export interface DruxtConfigHold<T> {
  /**
   * Gets the value for a key.
   *
   * The held value is returned. When there is none, the value is read once and held. A read with a `maxAge` is held
   * only for that long. A failure stands for `failureMaxAge` seconds.
   */
  get(key?: string): Promise<DruxtHeld<T>>
  /** Drops every value this hold keeps, for every build. The next render reads them again. */
  clear(): Promise<void>
}

/**
 * Holds site configuration read from Drupal, once per build and key.
 *
 * A server render then reads it from storage, not from Drupal. A hold suits what is the same for every visitor, such
 * as Drupal's date formats or a theme's block placements. A read made with the build's credentials is held for
 * everyone.
 *
 * - Concurrent reads of one key share a request.
 * - A read that spans a clear is handed to its callers but not held.
 * - A failed read stands for `failureMaxAge` seconds, so a failing Drupal is not read again on every render.
 * - Each value is stored under `<name>:<buildId>:<key>`, with `-` for an empty key.
 * - A clear removes every key under `<name>:`.
 * - A read of `undefined` is held, and answered, as `null`.
 *
 * Each consumer clears its hold on the `druxt:cache:clear` Nitro hook, as entity's server plugin does for its date
 * formats.
 *
 * @param options - The storage, the build, the hold's name and the reader.
 * @throws A `TypeError` when the name is empty, or has a colon or a slash.
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
  // unstorage drivers read a colon and a slash as separators, so a name with either would join another hold's keys.
  // Nor may it hold a character a driver reads as more than itself, such as a question mark.
  if (!/^[\w.-]+$/.test(name || '')) throw new TypeError(`[druxt] createDruxtConfigHold() needs a name of letters, digits, dots, dashes and underscores, such as 'date-formats', not '${name}'.`)
  // One part of a storage key. The empty part is held as a dash, and a part that starts with a dash gains one. Any
  // character a driver reads as a separator, or drops, is encoded. So no two parts share an entry.
  const part = (text: string) => encodeURIComponent(text === '' || text.startsWith('-') ? `-${text}` : text)
  const storageKey = (key: string) => `${name}:${part(buildId)}:${part(key)}`
  // Each clear moves this on, so a read that started before the clear is not held.
  let generation = 0
  const pending = new Map<string, Promise<DruxtHeld<T>>>()
  // Each key's last failed read, and when it stops standing. Kept in this process only.
  const failures = new Map<string, { error: unknown, until: number }>()

  // Reads a key: from storage, else from a failure that still stands, else from Drupal.
  const fetch = async (key: string, since: number): Promise<DruxtHeld<T>> => {
    const held = await storage.getItem<Held<DruxtHeld<T>>>(storageKey(key))
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
    // `undefined` is held as null, so a JSON driver keeps the key and the entry counts as held.
    const value = (result.value === undefined ? null : result.value) as DruxtHeld<T>
    if (since === generation) await storage.setItem<Held<DruxtHeld<T>>>(storageKey(key), { value, ...(maxAge ? { expires: Date.now() + maxAge * 1000 } : {}) })
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
      // Every build's keys are removed. A driver may ignore the base, so only this hold's keys are removed.
      const keys = await storage.getKeys(`${name}:`)
      await Promise.all(keys.map((k) => storage.removeItem(k)))
    },
  }
}
