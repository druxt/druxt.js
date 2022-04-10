import { DruxtClient } from 'druxt'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

/**
 * DruxtMenu class.
 *
 * Provides methods for accessing Menu items from the Drupal JSON:API.
 */
class DruxtMenu {
  /**
   * DruxtMenu constructor.
   *
   * - Validates module options.
   * - Sets up a DruxtRouter instance.
   *
   * @example @lang js
   * const druxtMenu = new DruxtMenu('https://example.com', {})
   *
   * @param {string} baseUrl - The URL of the Drupal backend.
   * @param {ModuleOptions} options - The module options.
   */
  constructor (baseUrl, options = {}) {
    // Check for URL.
    if (!baseUrl) {
      throw new Error('The \'baseUrl\' parameter is required.')
    }

    this.options = {
      menu: {
        jsonApiMenuItems: false
      },
      ...options
    }

    /**
     * Instance of the Druxt Client.
     *
     * @type {DruxtClient}
     * @see {@link http://druxtjs.org/api/client}
     */
    this.druxt = new DruxtClient(baseUrl, options)
  }

  /**
   * Builds the JSON:API query.
   *
   * @private
   *
   * @param {string} resource - The JSON:API resource type.
   * @param {string} menuName  - The menu name.
   * @param {string[]} requiredFields - An array of required fields for the menu resource.
   * @param {object} settings - Druxt menu query settings.
   *
   * @returns {DrupalJsonApiParams}
   */
  buildQuery(resource, menuName, requiredFields, settings) {
    const query = new DrupalJsonApiParams()
      .addFilter('enabled', '1')
      .addFilter('menu_name', menuName)

    // Filter fields based on settings.
    let fields = []
    if ((settings || {}).requiredOnly) {
      fields = [...requiredFields]
    }
    if (Array.isArray((settings || {}).fields)) {
      fields = [...settings.fields, ...requiredFields]
    }
    if (fields.length) {
      query.addFields(resource, fields)
    }

    return query
  }

  /**
   * Gets the menu items JSON:API resources using the configured method.
   *
   * @example @lang js
   * const menu = await druxtMenu.get('main')
   *
   * @param {string} menuName - The menu name.
   * @param {object} settings - The Druxt Menu query settings object.
   * @param {string} prefix - (Optional) The JSON:API endpoint prefix or langcode.
   */
  async get(menuName, settings, prefix) {
    if (this.options.menu.jsonApiMenuItems) {
      return this.getJsonApiMenuItems(menuName, settings, prefix)
    }

    return this.getMenuLinkContent(menuName, settings, prefix)
  }

  /**
   * Gets a menus 'menu_link_content' JSON:API resources.
   *
   * - This method can only retrieve user created menu items.
   * - This is the default method for the `get()` method.
   *
   * @example @lang js
   * const menu = await druxtMenu.getMenuLinkContent('menu')
   *
   * @param {string} menuName - The menu name.
   * @param {object} settings - The Druxt Menu query settings object.
   * @param {string} prefix - (Optional) The JSON:API endpoint prefix or langcode.
   */
  async getMenuLinkContent(menuName, settings, prefix) {
    const resource = 'menu_link_content--menu_link_content'
    const requiredFields = ['bundle', 'link', 'menu_name', 'parent', 'title', 'weight']

    // Build query.
    const query = this.buildQuery(resource, menuName, requiredFields, settings)

    const entities = []
    const collections = await this.druxt.getCollectionAll(resource, query, prefix)
    for (const collection of collections) {
      for (const entity of collection.data) {
        entities.push(entity)
      }
    }

    return { entities }
  }

  /**
   * Gets menu items via the Drupal JSON:API Menu Items module.
   *
   * - This method gets all menu items, but requires the JSON:API Menu Items module.
   * - This method is used by the `get()` method when the `jsonApiMenuItems` option is set.
   *
   * @see {@link https://www.drupal.org/project/jsonapi_menu_items|JSON:API Menu Items}
   *
   * @example @lang js
   * const menu = await druxtMenu.getJsonApiMenuItems(
   *   'menu',
   *   {
   *     requiredOnly: true,
   *   }
   * )
   *
   * @param {string} menuName - The menu name.
   * @param {object} settings - The Druxt Menu query settings object.
   * @param {string} prefix - (Optional) The JSON:API endpoint prefix or langcode.
   */
  async getJsonApiMenuItems(menuName, settings, prefix) {
    const menuItemsResource = `menu_items--${menuName}`
    const resource = 'menu_link_content--menu_link_content'
    const requiredFields = ['menu_name', 'parent', 'title', 'url', 'weight']

    // Add the JSON API Menu items resource to the index.
    await this.druxt.getIndex(undefined, prefix)
    if (!(this.druxt.index[prefix][menuItemsResource] || {}).href) {
      this.druxt.index[prefix][menuItemsResource] = { href: `${prefix || ''}${this.druxt.options.endpoint}/menu_items/${menuName}` }
    }

    // Build query.
    const query = this.buildQuery(resource, menuName, requiredFields, settings)

    // Apply filters.
    if ((settings || {}).max_depth) {
      query.addFilter('max_depth', parseInt(settings.max_depth))
    }
    if ((settings || {}).min_depth) {
      query.addFilter('min_depth', parseInt(settings.min_depth))
    }
    if ((settings || {}).parent) {
      query.addFilter('parent', settings.parent)
    }

    const entities = []
    let collections = []
    try {
      collections = await this.druxt.getCollectionAll(menuItemsResource, query, prefix)
    } catch(e) {
      return { entities }
    }
    for (const collection of collections) {
      for (const entity of collection.data) {
        entities.push({
          ...entity,
          attributes: {
            ...entity.attributes,
            link: {
              uri: `internal:${entity.attributes.url}`,
            },
            parent: entity.attributes.parent || null,
          }
        })
      }
    }

    return { entities }
  }
}

export { DruxtMenu }

/**
 * Module options.
 *
 * @typedef {object} ModuleOptions
 *
 * @see {@link ./typedefs/moduleOptions|ModuleOptions}
 */
