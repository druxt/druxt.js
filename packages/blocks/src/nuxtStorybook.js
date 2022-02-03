import { resolve } from 'path'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient } from 'druxt'

const titleFn = (parts) =>
  parts.map((part) =>
    part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, ' ')
  ).join('/')

export default async function ({ stories }) {
  const { addTemplate, options } = this

  // Setup DruxtClient instance.
  const druxt = new DruxtClient(options.druxt.baseUrl, { ...options.druxt, proxy: { api: false } })

  // Get all required data.
  const query = new DrupalJsonApiParams().addFilter('status', true)
  const blocks = (await druxt.getCollectionAll('block--block', query)).map((collection) => collection.data).flat()
  const themes = Array.from(new Set(blocks.map((o) => o.attributes.theme)))

  // DruxtBlock story.
  addTemplate({
    src: resolve(__dirname, `../templates/druxt-block.stories.js`),
    fileName: `stories/druxt-block.stories.js`,
    options: { blocks }
  })

  // DruxtBlock instance stories.
  blocks.forEach((block) => {
    addTemplate({
      src: resolve(__dirname, `../templates/druxt-block-instance.stories.js`),
      fileName: `stories/druxt-block.${block.attributes.drupal_internal__id}.stories.js`,
      options: {
        block,
        title: titleFn(['Druxt', 'Blocks', block.attributes.theme, block.attributes.region, block.attributes.drupal_internal__id])
      }
    })
  })

  // DruxtBlockRegion story.
  addTemplate({
    src: resolve(__dirname, `../templates/druxt-block-region.stories.js`),
    fileName: `stories/druxt-block-region.stories.js`,
    options: {
      regions: Array.from(new Set(blocks.map((o) => o.attributes.region))),
      themes
    }
  })

  // DruxtBlockRegion instance stories.
  themes.forEach((theme) => {
    const regions = Array.from(new Set(blocks.filter((o) => o.attributes.theme === theme).map((o) => o.attributes.region)))
    regions.forEach((region) => {
      addTemplate({
        src: resolve(__dirname, `../templates/druxt-block-region-instance.stories.js`),
        fileName: `stories/druxt-block-region.${theme}.${region}.stories.js`,
        options: {
          region,
          title: titleFn(['Druxt', 'Blocks', theme, region]),
          theme,
        }
      })
    })
  })

  // Add stories.
  stories.push(resolve(options.buildDir, `./stories/druxt-block.stories.js`))
  stories.push(resolve(options.buildDir, `./stories/druxt-block-region.stories.js`))
  stories.push(resolve(options.buildDir, `./stories/druxt-block.*.stories.js`))
  stories.push(resolve(options.buildDir, `./stories/druxt-block-region.*.stories.js`))
}
