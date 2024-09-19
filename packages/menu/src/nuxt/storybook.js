import { addTemplate } from '@nuxt/kit'
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
  const { options } = this

  // Setup DruxtClient instance.
  const druxt = new DruxtClient(options.druxt.baseUrl, { ...options.druxt, proxy: { api: false } })

  // Get all required data.
  const resourceType = 'menu--menu'
  const query = new DrupalJsonApiParams()
    .addFilter('status', 1)
    .addFields(resourceType, ['description', 'drupal_internal__id', 'label'])
  const menus = (await druxt.getCollectionAll(resourceType, query)).map((collection) => collection.data).flat()

  // DruxtMenu story.
  addTemplate({
    src: resolve(__dirname, `../templates/druxt-menu.stories.js`),
    fileName: `stories/druxt-menu.stories.js`,
    options: { menus }
  })
  stories.push(resolve(options.buildDir, './stories/druxt-menu.stories.js'))

  // DruxtMenu instance stories.
  menus.forEach((menu) => {
    const name = menu.attributes.drupal_internal__id
    const { description, label } = menu.attributes

    const title = titleFn(['Druxt', 'Menu', label])
    addTemplate({
      src: resolve(__dirname, '../templates/druxt-menu.instance.stories.js'),
      fileName: `stories/druxt-menu.${name}.stories.js`,
      options: { description, label, name, title },
    })
  })
  stories.push(resolve(options.buildDir, './stories/druxt-menu.*.stories.js'))
}
