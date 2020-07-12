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

    // Setup Druxt Router.
    this.druxtRouter = new DruxtRouter(baseURL, options)
  }

  async get(menuName) {
    const resource = 'menu_link_content--menu_link_content'

    const query = new DrupalJsonApiParams()
      .addFilter('enabled', '1')
      .addFilter('menu_name', menuName)
      .addFields(resource, ['description', 'link', 'menu_name', 'parent', 'title', 'weight'])

    const entities = await this.druxtRouter.getResources(resource, query, { all: true })

    return { entities }
  }
}

export { DruxtMenu }
