import { resolve } from 'path'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient } from 'druxt'

const titleFn = (parts) =>
  parts.map((part) =>
    part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, ' ')
  ).join('/')

export default async function ({ stories }) {
  const { addTemplate, options } = this

  const druxt = new DruxtClient(options.druxt.baseUrl, options.druxt)

  const query = new DrupalJsonApiParams().addFilter('status', true)
  const blocks = (await druxt.getCollectionAll('block--block', query)).map((collection) => collection.data).flat()

  // DruxtBlock.
  const blockStories = blocks.map((block) => {
    addTemplate({
      src: resolve(__dirname, `../templates/druxt-block.stories.js`),
      fileName: `stories/druxt-block.${block.attributes.drupal_internal__id}.stories.js`,
      options: {
        block,
        title: titleFn(['Druxt', 'Blocks', block.attributes.theme, block.attributes.region, block.attributes.drupal_internal__id])
      }
    })

    return resolve(options.buildDir, `./stories/druxt-block.${block.attributes.drupal_internal__id}.stories.js`)
  })
  stories.push.apply(stories, blockStories)

  // DruxtBlockRegion.
  const themes = Array.from(new Set(blocks.map((o) => o.attributes.theme)))
  const regionStories = themes.map((theme) => {
    const regions = Array.from(new Set(blocks.filter((o) => o.attributes.theme === theme).map((o) => o.attributes.region)))
    return regions.map((region) => {
      addTemplate({
        src: resolve(__dirname, `../templates/druxt-block-region.stories.js`),
        fileName: `stories/druxt-block-region.${theme}.${region}.stories.js`,
        options: {
          region,
          title: titleFn(['Druxt', 'Blocks', theme, region]),
          theme,
        }
      })

      return resolve(options.buildDir, `./stories/druxt-block-region.${theme}.${region}.stories.js`)
    })
  }).flat()
  stories.push.apply(stories, regionStories)
}
