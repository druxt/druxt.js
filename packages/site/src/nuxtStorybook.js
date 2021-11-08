import { resolve } from 'path'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient } from 'druxt'

const titleFn = (parts) =>
  parts.map((part) =>
    part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, ' ')
  ).join('/')

export default async function ({ options, stories }) {
  const { addTemplate } = this

  const druxt = new DruxtClient(options.baseUrl, { ...options, proxy: { api: false } })

  const type = 'block--block'
  const query = new DrupalJsonApiParams().addFields(type, ['theme'])
  const resources = (await druxt.getCollectionAll(type, query)).map((collection) => collection.data).flat()
  const themes = [...new Set(resources.map((o) => o.attributes.theme))].sort()
  const siteStories = themes.map((theme) => {
    addTemplate({
      src: resolve(__dirname, '../templates/druxt-site.stories.js'),
      fileName: `stories/druxt-site.${theme}.stories.js`,
      options: {
        theme,
        title: titleFn(['Druxt', 'Site', 'Themes', theme])
      }
    })
    return resolve(this.options.buildDir, `./stories/druxt-site.${theme}.stories.js`)
  })
  stories.push.apply(stories, siteStories)
}
