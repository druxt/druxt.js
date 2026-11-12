// What DruxtDebug's summary says about its JSON, in production as in development.

/** Whether a JSON value is an object or an array. */
export const isTree = (value: unknown): value is object => !!value && typeof value === 'object'

/** An object's key count, or an array's item count, in words. */
export const size = (value: object): string => {
  const length = Object.keys(value).length
  return Array.isArray(value) ? `${length} ${length === 1 ? 'item' : 'items'}` : `${length} ${length === 1 ? 'key' : 'keys'}`
}
