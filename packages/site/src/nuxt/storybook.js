import { addTemplate } from '@nuxt/kit'
import { resolve } from 'path'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient } from 'druxt'

const titleFn = (parts) =>
  parts.map((part) =>
    part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, ' ')
  ).join('/')

export default async function ({ options, stories }) {
  // Setup DruxtClient instance.
  const druxt = new DruxtClient(options.baseUrl, { ...options, proxy: { api: false } })

  // Get all required data.
  const type = 'block--block'
  const query = new DrupalJsonApiParams().addFields(type, ['theme'])
  const resources = (await druxt.getCollectionAll(type, query)).map((collection) => collection.data).flat()
  const themes = [...new Set(resources.map((o) => o.attributes.theme))].sort()

  // DruxtSite story.
  addTemplate({
    src: resolve(__dirname, `../templates/druxt-site.stories.js`),
    fileName: `stories/druxt-site.stories.js`,
    options: { themes }
  })

  // DruxtSite instance stories.
  themes.forEach((theme) => {
    addTemplate({
      src: resolve(__dirname, '../templates/druxt-site.instance.stories.js'),
      fileName: `stories/druxt-site.${theme}.stories.js`,
      options: {
        theme,
        title: titleFn(['Druxt', 'Site', 'Themes', theme])
      }
    })
  })

  // Add stories.
  stories.push(resolve(this.options.buildDir, './stories/druxt-site.stories.js'))
  stories.push(resolve(this.options.buildDir, './stories/druxt-site.*.stories.js'))
}
