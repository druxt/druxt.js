/**
 * Druxt utility class.
 *
 * @deprecated
 */
class DruxtClass {
  /**
   * Class constructor.
   *
   * @example @lang js
   * import { DruxtClass } from 'druxt'
   * const druxt = new DruxtClass()
   */
  constructor() {}

  /**
   * Get component data from available options.
   *
   * @param {object} vm - The DruxtJS module Vue.js component.
   * @param {string[]} options - The component naming options.
   * @param {boolean} [all=false] - Returns all options if true, else only globally registered options.
   * @param {string} [prefix] - A string to prefix all components.
   *
   * @returns {WrapperComponents}
   */
  getComponents(vm, options, all = false, prefix) {
    const results = []
    const unique = {}

    options
      // Filter out incorrectly typed items.
      .filter(item => Array.isArray(item))

      // Process each item.
      .map(item => {
        const variants = []

        item.map(string => {
          const parts = variants.length ? [...variants[0].parts] : []
          parts.push(string)
          const clone = [...parts]

          // Attach prefix as required.
          if (typeof prefix !== 'string' && (prefix !== false || typeof prefix === 'undefined') && ((vm || {}).$options || {}).name) {
            prefix = vm.$options.name.match(/[A-Z][a-z]+/g).map(word => word.toLowerCase()).join('-')
          }

          if (prefix) {
            clone.unshift(prefix)
          }

          // Generate component name values.
          const kebab = clone.map(string => string.toLowerCase().replace(/--|_/g, '-')).join('-')
          const pascal = kebab.replace(/((\b|[^a-zA-Z0-9]+)[a-zA-Z0-9])/gi, (match, p1, p2) => match.toUpperCase().replace(p2, ''))

          // Check if component is globally registered.
          let global = false
          for (const name of [kebab, pascal]) {
            if (typeof (((vm || {}).$options || {}).components || {})[name] !== 'undefined') {
              global = true
              break
            }
          }

          variants.unshift({ global, kebab, parts, pascal, prefix })
        })

        // Add variants to results.
        variants.map(variant => {
          // Ensure unique results.
          if (unique[variant.pascal]) {
            return
          }
          unique[variant.pascal] = true

          results.push(variant)
        })
      })

    // Return globally registered components or all.
    return results
      .filter(option => option.global || !!all)
      .sort((a, b) => b.parts.length - a.parts.length)
  }

  /**
   * Get the Druxt module data from the referenced component.
   *
   * @returns {ModuleData}
   */
  async getModuleData(vm) {
    if (typeof ((vm || {}).$options || {}).druxt !== 'function') {
      return false
    }

    const moduleData = await vm.$options.druxt({ vm })

    if ((vm.$options || {}).name) {
      moduleData.name = vm.$options.name.match(/[A-Z][a-z]+/g).map(word => word.toLowerCase()).join('-')
    }

    return moduleData
  }
}

export { DruxtClass }

/**
 * @typedef {object} ModuleData
 * @property {Array.<string[]>} componentOptions - An array of arrays of strings for component naming.
 * @property {object} propsData - Property data to bind to the wrapper component.
 *
 * @example @lang js
 * {
 *   componentOptions: [['wrapper', 'component']],
 *   propsData: {},
 * }
 */

 /**
  * @typedef {object[]} WrapperComponents
  * @property {boolean} global - Component global registration state.
  * @property {string} kebab - The component name in kebab case.
  * @property {string[]} parts - The component naming parts.
  * @property {string} pascal - The component name in pascal case.
  * @property {string} prefix - The component name prefix.
  *
  * @example @lang js
  * [{
  *   global: true,
  *   kebab: 'druxt-test-module-wrapper',
  *   parts: ['wrapper'],
  *   pascal: 'DruxtTestModuleWrapper',
  *   prefix: 'druxt-test-module',
  * }]
  */
