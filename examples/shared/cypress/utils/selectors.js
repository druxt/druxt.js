/**
 * Shared Cypress selector helpers for DruxtJS example apps.
 */

/**
 * CSS attribute-selector matching Nuxt's `data-fetch-key` attribute.
 *
 * Every Druxt component built on the `DruxtModule` mixin (`DruxtEntity`,
 * `DruxtMenu`, `DruxtView`, `DruxtBlock`, ...) defines a `fetchKey()` that
 * Nuxt's fetch mixin renders onto the component's root element as
 * `data-fetch-key="<ComponentName>:<param>:<param>:<counter>"`. Matching on
 * a prefix (e.g. `DruxtEntity:node--recipe`) targets a component by type
 * without depending on markup or CSS classes, which the themed examples
 * change per design system.
 *
 * @param {string} prefix - The fetch key prefix to match, e.g.
 *   `DruxtEntity:node--recipe` or `DruxtMenu:main`.
 * @returns {string} A CSS attribute-selector string.
 */
export function byFetchKey (prefix) {
  return `[data-fetch-key^="${prefix}"]`
}

/**
 * CSS attribute-selector matching a `data-testid` attribute.
 *
 * @param {string} id - The expected `data-testid` value.
 * @returns {string} A CSS attribute-selector string.
 */
export function byTestId (id) {
  return `[data-testid="${id}"]`
}
