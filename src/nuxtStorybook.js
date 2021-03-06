import merge from 'deepmerge'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient } from 'druxt'
import { resolve } from 'path'

// @todo - Use component naming convention for title.
const titleFn = (parts) =>
parts
  .map(
    (part) =>
      part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, ' ')
  )
  .join('/')

export default async function ({ stories }) {
  const { addTemplate, options } = this

  const druxt = new DruxtClient(options.druxt.baseUrl, options.druxt)

  const resourceType = 'view--view'
  const query = new DrupalJsonApiParams()
    .addFilter('status', 1)
    .addFields(resourceType, ['display', 'drupal_internal__id'])
  const collections = await druxt.getCollectionAll(resourceType, query)

  // Build Views data.
  const views = {}
  for (const collection of collections) {
    for (const view of collection.data) {
      const { display, drupal_internal__id } = view.attributes

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

      views[drupal_internal__id] = { displays, uuid: view.id }
    }
  }

  // Write Views stories.
  for (const viewId of Object.keys(views)) {
    const { displays, uuid } = views[viewId]

    // Ensure 'Default' is the first item.
    displays.sort((a) => (a.id === 'default' ? -1 : 0))

    const title = titleFn(['Druxt Views', viewId])

    addTemplate({
      src: resolve(__dirname, '../nuxt/druxt-views.stories.js'),
      fileName: `stories/druxt-views.${viewId}.stories.js`,
      options: { displays, title, uuid, viewId },
    })
  }

  // Add stories.
  stories.push(
    resolve(options.buildDir, './stories/druxt-views.*.stories.js')
  )
}
