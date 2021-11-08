import merge from 'deepmerge'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient } from 'druxt'
import { resolve } from 'path'

export default async function ({ stories }) {
  const { addTemplate, options } = this

  const druxt = new DruxtClient(options.druxt.baseUrl, { ...options.druxt, proxy: { api: false } })

  const resourceType = 'view--view'
  const query = new DrupalJsonApiParams()
    .addFilter('status', 1)
    .addFields(resourceType, ['display', 'description', 'drupal_internal__id', 'label'])
  const collections = await druxt.getCollectionAll(resourceType, query)

  // Build Views data.
  const views = {}
  for (const collection of collections) {
    for (const view of collection.data) {
      const { description, display, drupal_internal__id, label } = view.attributes

      const displays = Object.values(display)
        .filter((item) => {
          const options = item.id === 'default'
            ? item
            : merge(display.default, item)

          const extenders = options.display_options.display_extenders
          if (!Array.isArray(extenders) && !(extenders.jsonapi_views || {}).enabled) {
            return false
          }

          return options.display_options.row.type.startsWith('entity:')
        })

      if (displays.length) {
        views[drupal_internal__id] = { description, displays, uuid: view.id, label }
      }
    }
  }

  // Write Views stories.
  for (const viewId of Object.keys(views)) {
    const { description, displays, label, uuid } = views[viewId]

    // Ensure 'Default' is the first item.
    displays.sort((a) => (a.id === 'default' ? -1 : 0))

    const title = ['Druxt', 'Views', label].join('/')

    addTemplate({
      src: resolve(__dirname, '../templates/druxt-views.stories.js'),
      fileName: `stories/druxt-views.${viewId}.stories.js`,
      options: { description, displays, title, uuid, viewId },
    })
  }

  // Add stories.
  stories.push(
    resolve(options.buildDir, './stories/druxt-views.*.stories.js')
  )
}
