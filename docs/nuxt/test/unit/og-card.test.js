const { ogCard, SECTIONS, MODULE_ICON_PATHS } = require('~/lib/og-card')
const { pageFromDoc, ogImageFile } = require('~/lib/og-images')
const { ogImageUrl } = require('~/lib/site')

/** Every text node in a Satori element tree, in render order. */
const texts = (node, out = []) => {
  if (typeof node === 'string') out.push(node)
  else if (Array.isArray(node)) node.forEach((child) => texts(child, out))
  else if (node && node.props) texts(node.props.children, out)
  return out
}

/** Every svg node in a Satori element tree. */
const svgs = (node, out = []) => {
  if (Array.isArray(node)) node.forEach((child) => svgs(child, out))
  else if (node && node.type === 'svg') out.push(node)
  else if (node && node.props) svgs(node.props.children, out)
  return out
}

describe('pageFromDoc', () => {
  test('module pages carry their package and module icon slug', () => {
    const page = pageFromDoc({ route: '/modules/entity', title: 'Entity', description: 'x', section: 'modules' })
    expect(page.pkg).toBe('druxt-entity')
    expect(page.module).toBe('entity')
    expect(page.index).toBe(false)
  })

  test('the core module keeps its unprefixed package name', () => {
    const page = pageFromDoc({ route: '/modules/druxt', title: 'Druxt', description: 'x', section: 'modules' })
    expect(page.pkg).toBe('druxt')
    expect(page.module).toBe('druxt')
  })

  test('API pages swap the excerpt for the kind and take the module icon', () => {
    const page = pageFromDoc({
      route: '/api/packages/druxt-entity/components/DruxtEntity',
      title: 'DruxtEntity',
      description: 'jsdoc noise',
      section: 'api',
    })
    expect(page.description).toBeUndefined()
    expect(page.kind).toBe('Component reference')
    expect(page.pkg).toBe('druxt-entity')
    expect(page.module).toBe('entity')
  })

  test('changelogs are release notes', () => {
    const page = pageFromDoc({ route: '/api/packages/druxt/CHANGELOG', title: 'Changelog', description: '', section: 'api' })
    expect(page.kind).toBe('Release notes')
  })

  test('a section landing page is an index', () => {
    expect(pageFromDoc({ route: '/tutorials', title: 'Tutorials', description: '', section: 'tutorials' }).index).toBe(true)
  })
})

describe('ogCard', () => {
  test('a module page renders its own icon and plain package name, no pill', () => {
    const tree = ogCard({ title: 'Entity', section: 'modules', module: 'entity', pkg: 'druxt-entity', path: '/modules/entity' })
    const [eyebrowIcon] = svgs(tree)
    const drawn = eyebrowIcon.props.children.map((p) => p.props.d)
    expect(drawn).toEqual(MODULE_ICON_PATHS.entity.map(([d]) => d))
    expect(texts(tree)).toContain('druxt-entity')
    expect(JSON.stringify(tree)).not.toContain('borderRadius":999')
  })

  test('section landing pages set the plural eyebrow', () => {
    expect(texts(ogCard({ title: 'How-to guides', section: 'how-to', index: true, path: '/how-to' }))).toContain('How-to guides')
    expect(texts(ogCard({ title: 'Theming', section: 'how-to', path: '/how-to/theming' }))).toContain('How-to')
  })

  test('API titles step down in size for long symbols', () => {
    const short = ogCard({ title: 'DruxtRouter', section: 'api', path: '/x' })
    const long = ogCard({ title: 'DruxtEntityFormButtonsExtended', section: 'api', path: '/x' })
    const sizeOf = (tree, title) =>
      tree.props.children[0].props.children.find((n) => n.props.children === title).props.style.fontSize
    expect(sizeOf(short, 'DruxtRouter')).toBe(68)
    expect(sizeOf(long, 'DruxtEntityFormButtonsExtended')).toBe(56)
  })

  test('no description and no kind renders no line rather than a gap', () => {
    const tree = ogCard({ title: 'Bare', section: 'tutorials', path: '/tutorials/bare' })
    expect(tree.props.children[0].props.children).toHaveLength(2)
  })

  test('an untitled page falls back to the site name', () => {
    expect(texts(ogCard({ section: 'tutorials', path: '/x' }))).toContain('DruxtJS')
  })

  test('every section key resolves an icon', () => {
    for (const key of Object.keys(SECTIONS)) {
      expect(svgs(ogCard({ title: 'x', section: key, path: '/x' }))).toHaveLength(2)
    }
  })
})

describe('routes and URLs', () => {
  test('image files nest under the route path', () => {
    expect(ogImageFile('/modules/entity')).toBe('modules/entity.png')
    expect(ogImageFile('/api/packages/druxt/CHANGELOG')).toBe('api/packages/druxt/CHANGELOG.png')
  })

  test('section pages get card URLs, everything else falls back', () => {
    expect(ogImageUrl('/modules/entity')).toBe('https://druxtjs.org/og/modules/entity.png')
    expect(ogImageUrl('/tutorials/')).toBe('https://druxtjs.org/og/tutorials.png')
    expect(ogImageUrl('/')).toBeNull()
    expect(ogImageUrl('/guide/theming')).toBeNull()
  })
})
