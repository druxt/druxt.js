/**
 * The `useAsyncData` key of a module instance. Two instances with the same
 * key hold the same data, on one page or across prerendered pages, so the key
 * names what the data depends on: the module, the language, its inputs, and
 * whether it resolves a wrapper.
 *
 * @param name - The module's component name.
 * @param lang - The language the module renders in.
 * @param variant - What the instance renders through, such as `wrapper` or `bare`: the payload differs between them.
 * @param key - The module's own key, when its contract gives one.
 * @param inputs - The module's watched inputs, when its contract declares them.
 * @returns The key, or undefined when the module declares neither a key nor inputs, and the caller falls back to a per-instance id.
 */
export const moduleKey = (name: string, lang: string | undefined, variant: string, key?: () => string, inputs?: () => unknown[]): string | undefined => {
  const suffix = lang ? `:${lang}` : ''
  if (key) return `druxt:${key()}${suffix}:${variant}`
  if (inputs) return `druxt:${name}${suffix}:${JSON.stringify(inputs())}:${variant}`
  return undefined
}
