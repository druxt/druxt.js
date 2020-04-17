import axios from 'axios'
import qs from 'qs'

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

    // Setup Axios.
    let axiosSettings = { baseURL }
    if (typeof options.axios === 'object') {
      axiosSettings = Object.assign(axiosSettings, options.axios)
    }
    this.axios = axios.create(axiosSettings)
  }

  async get(menuName) {
    let entities = []

    const query = {
      fields: {
        // @TODO - Add support for customizable resource name?
        'menu_link_content--menu_link_content': 'menu_name,parent,status,title,url,weight'
      },
      filter: {
        enabled: 1,
        menu_name: menuName
      }
    }

    // @TODO - Add support for customizable resource name.
    let url = '/api/menu_link_content/menu_link_content?' + qs.stringify(query)

    let loading = true
    while (loading) {
      const results = await this.axios.get(url)

      entities = entities.concat(results.data.data)

      if (results.data.links.next) {
        url = results.data.links.next.href
      }

      else {
        loading = false
      }
    }

    return { entities }
  }
}

export { DruxtMenu }
