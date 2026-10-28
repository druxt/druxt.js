import fs from 'fs'
import path from 'path'
import template from 'lodash/template'

// Text written in Drupal, holding a single quote, a double quote and a backslash.
const text = 'It\'s "quoted" \\ done'

// Renders a package's story template as Nuxt does and returns its exports.
const render = (pkg, file, options) => {
  const source = fs.readFileSync(path.resolve(__dirname, `../packages/${pkg}/templates/${file}`), 'utf8')
  const rendered = template(source, { interpolate: /<%=([\s\S]+?)%>/g, imports: { devalue: JSON.stringify } })({ options })
    .replace(/^import (\w+) from .*$/gm, 'const $1 = { __docgenInfo: { props: [] } }')
    .replace('export default', 'stories.default =')
    .replace(/^export const (\w+)/gm, 'const $1 = stories.$1')
  const stories = {}
  new Function('stories', rendered)(stories)
  return stories
}

// Every string value in the story exports.
const strings = (value) => typeof value === 'string'
  ? [value]
  : Object.values(value || {}).map(strings).flat()

describe('Story templates', () => {
  test('blocks', () => {
    const block = render('blocks', 'druxt-block.instance.stories.js', {
      block: { id: 'uuid', attributes: { drupal_internal__id: 'block', settings: { label: text } } },
      title: text,
    })
    expect(block.default.title).toBe(text)
    expect(block.default.parameters.docs.description.component).toContain(`Renders the **${text}** block.`)

    const region = render('blocks', 'druxt-block-region.instance.stories.js', { region: 'content', theme: 'olivero', title: text })
    expect(region.default.title).toBe(text)
  })

  test('entity', () => {
    const options = { displays: ['default'], entities: [{ id: 'uuid', title: text }], resourceType: 'node--page', title: text }
    for (const file of ['druxt-entity.instance.stories.js', 'druxt-entity-form.instance.stories.js']) {
      const stories = render('entity', file, options)
      expect(stories.default.title).toBe(text)
      expect(strings(stories)).toContain(`${text} (uuid)`)
    }
  })

  test('menu', () => {
    const menus = render('menu', 'druxt-menu.stories.js', { menus: [{ attributes: { drupal_internal__id: 'main', label: text } }] })
    expect(strings(menus)).toContain(text)

    const menu = render('menu', 'druxt-menu.instance.stories.js', { description: text, label: text, name: 'main', title: text })
    expect(menu.default.title).toBe(text)
    expect(menu.default.parameters.docs.description.component).toBe(text)
    expect(menu.Default.storyName).toBe(text)
  })

  test('site', () => {
    const site = render('site', 'druxt-site.instance.stories.js', { theme: 'olivero', title: text })
    expect(site.default.title).toBe(text)
  })

  test('views', () => {
    const views = render('views', 'druxt-views.stories.js', { views: { recipes: { label: text, uuid: 'uuid', viewId: 'recipes' } } })
    expect(strings(views)).toContain(`${text} (uuid)`)
    expect(strings(views)).toContain(`${text} (recipes)`)

    const view = render('views', 'druxt-views.instance.stories.js', {
      displays: [{ id: 'page_1', display_title: text }],
      label: text,
      title: text,
      viewId: 'recipes',
    })
    expect(view.default.parameters.docs.description.component).toContain(`Renders the **${text}** view.`)
    expect(view.Page_1.storyName).toBe(text)
  })
})
