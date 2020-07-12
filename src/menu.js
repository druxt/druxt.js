import { DruxtRouter } from 'druxt-router'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

class DruxtMenu {
  /**
   * Constructor.
   *
   * @param string baseURL
   * @param object options
   */
  constructor (baseURL, options = {}) {
    // Check for URL.
    if (!baseURL) {
      throw new Error('The \'baseURL\' parameter is required.')
    }

    this.options = {
      endpoint: '/jsonapi',
      menu: {
        jsonApiMenuItems: false
      },

      ...options
    }

    // Setup Druxt Router.
    this.druxtRouter = new DruxtRouter(baseURL, options)
  }

  async get(menuName) {
    if (this.options.menu.jsonApiMenuItems) {
      return this.getJsonApiMenuItems(menuName)
    }

    return this.getMenuLinkContent(menuName)
  }

  async getMenuLinkContent(menuName) {
    const resource = 'menu_link_content--menu_link_content'
    const fields = ['description', 'link', 'menu_name', 'parent', 'title', 'weight']

    const query = new DrupalJsonApiParams()
      .addFilter('enabled', '1')
      .addFilter('menu_name', menuName)
      .addFields(resource, fields)

    const entities = await this.druxtRouter.getResources(resource, query, { all: true })

    return { entities }
  }

  async getJsonApiMenuItems(menuName) {
    const resource = `menu_items--${menuName}`

    // Add the JSON API Menu items resource to the index.
    await this.druxtRouter.getIndex()
    this.druxtRouter.index[resource] = { href: `${this.options.endpoint}/menu_items/${menuName}` }

    const query = new DrupalJsonApiParams()
      .addFilter('enabled', '1')
      .addFilter('menu_name', menuName)

    const resources = await this.druxtRouter.getResources(resource, query, { all: true })

    const entities = resources.map(resource => {
      const entity = {
        id: resource.id,
        attributes: {
          description: resource.attributes.description,
          link: {
            uri: `internal:${resource.attributes.url}`
          },
          menu_name: menuName,
          parent: resource.attributes.parent.length ? resource.attributes.parent : null,
          title: resource.attributes.title,
          weight: resource.attributes.weight,
        },
        resource
      }
      return entity
    })

    return { entities }
  }
}

export { DruxtMenu }
