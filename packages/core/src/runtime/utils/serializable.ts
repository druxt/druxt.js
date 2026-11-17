/**
 * A copy of a value for the Nuxt payload, without functions, which the payload cannot serialize.
 *
 * Functions are removed from arrays and plain objects, at every depth. Any other value is returned as it is.
 *
 * @param value - The value.
 */
export const serializable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.filter((item) => typeof item !== 'function').map(serializable)
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value)
      .filter(([, item]) => typeof item !== 'function')
      .map(([key, item]) => [key, serializable(item)]))
  }
  return value
}
