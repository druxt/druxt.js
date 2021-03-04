import { resolve } from 'path'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient } from 'druxt'

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

  const resourceType = 'entity_view_display--entity_view_display'
  const query = new DrupalJsonApiParams()
    .addFilter('status', 1)
    .addFields(resourceType, ['bundle', 'mode', 'targetEntityType'])
  const collections = await druxt.getCollectionAll(resourceType, query)

  // Build Entity data.
  const entities = {}
  for (const collection of collections) {
    for (const display of collection.data) {
      const { bundle, mode, targetEntityType } = display.attributes

      entities[targetEntityType] = entities[targetEntityType] || {}
      entities[targetEntityType][bundle] =
        entities[targetEntityType][bundle] || []
      entities[targetEntityType][bundle].push(mode)
    }
  }

  // Write Entity stories.
  for (const entityType of Object.keys(entities)) {
    for (const bundle of Object.keys(entities[entityType])) {
      const modes = Array.from(new Set(entities[entityType][bundle]))

      // Ensure 'Default' is the first item.
      modes.sort((a) => (a === 'default' ? -1 : 0))

      const title = titleFn(['Druxt Entity', entityType, bundle])

      const type = `${entityType}--${bundle}`

      let uuids = []
      try {
        const query = new DrupalJsonApiParams()
          .addFilter('status', 1)
          .addFields(type, ['id'])
        const resources = await druxt.getCollection(type, query)
        uuids = resources.data.map((resource) => resource.id)
      } catch (e) {}

      if (uuids.length) {
        addTemplate({
          src: resolve(__dirname, '../nuxt/druxt-entity.stories.js'),
          fileName: `stories/druxt-entity.${type}.stories.js`,
          options: { modes, title, type, uuids },
        })
      }
    }
  }

  // Add stories.
  stories.push(
    resolve(options.buildDir, './stories/druxt-entity.*.stories.js')
  )
}
