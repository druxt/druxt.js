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

  const resourceType = 'menu--menu'
  const query = new DrupalJsonApiParams()
    .addFilter('status', 1)
    .addFields(resourceType, ['description', 'drupal_internal__id', 'label'])
  const collections = await druxt.getCollectionAll(resourceType, query)

  // Write Menu stories.
  for (const collection of collections) {
    for (const menu of collection.data) {
      const name = menu.attributes.drupal_internal__id
      const { description, label } = menu.attributes

      const title = titleFn(['Druxt', 'Menu', label])
      addTemplate({
        src: resolve(__dirname, '../templates/druxt-menu.stories.js'),
        fileName: `stories/druxt-menu.${name}.stories.js`,
        options: { description, label, name, title },
      })
    }
  }

  // Add stories.
  stories.push(
    resolve(options.buildDir, './stories/druxt-menu.*.stories.js')
  )
}
