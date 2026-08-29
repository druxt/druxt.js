/**
 * llms.txt is published for machine consumption, so its shape is a contract:
 * an H1, a blockquote summary, then H2 sections of `- [name](url): notes`.
 */

const { buildLlmsTxt, UTM } = require('../../lib/llms-txt')

const doc = (over) => ({
  route: '/guide/theming',
  title: 'Theming',
  description: 'How to theme.',
  weight: 0,
  section: 'guide',
  mtime: new Date('2024-01-02T00:00:00Z'),
  ...over,
})

const options = { origin: 'https://example.test' }

describe('buildLlmsTxt', () => {
  it('opens with the H1 and blockquote the format expects', () => {
    const lines = buildLlmsTxt([doc()], options).split('\n')

    expect(lines[0]).toBe('# DruxtJS')
    expect(lines[2].startsWith('> ')).toBe(true)
  })

  it('lists guide and module documents under their own headings', () => {
    const out = buildLlmsTxt([
      doc(),
      doc({ route: '/modules/entity', title: 'Entity', description: 'Entity components.', section: 'modules' }),
    ], options)

    expect(out).toContain('## Guide')
    expect(out).toContain('## Modules')
    expect(out).toContain('- [Theming](https://example.test/guide/theming?' + UTM + '): How to theme.')
    expect(out).toContain('- [Entity](https://example.test/modules/entity?' + UTM + '): Entity components.')
  })

  it('tags every content link so the file can be shown to earn its place', () => {
    const out = buildLlmsTxt([doc()], options)

    expect(UTM).toContain('utm_source=llms-txt')
    expect(out).toContain('?' + UTM)
  })

  it('orders documents by weight, then route', () => {
    const out = buildLlmsTxt([
      doc({ route: '/guide/b', title: 'B', weight: 5 }),
      doc({ route: '/guide/a', title: 'A', weight: -10 }),
    ], options)

    expect(out.indexOf('[A]')).toBeLessThan(out.indexOf('[B]'))
  })

  it('omits a section entirely when it has no documents', () => {
    const out = buildLlmsTxt([doc()], options)

    expect(out).toContain('## Guide')
    expect(out).not.toContain('## Modules')
  })

  it('lists API packages under Optional, one per package', () => {
    const out = buildLlmsTxt([
      doc({ route: '/api/packages/blocks', title: 'DruxtBlocksModule', section: 'api' }),
      doc({ route: '/api/packages/site', title: 'DruxtSiteMixin', section: 'api' }),
    ], options)

    expect(out).toContain('## Optional')
    expect(out).toContain('- [API reference](https://example.test/api?')
    expect(out).toContain('[Blocks API]')
    expect(out).toContain('[Site API]')
  })

  it('labels API packages from the route, not the generated title', () => {
    // docgen titles each package index after the first symbol it documents, so
    // /api/packages/site is titled "DruxtSiteMixin". See druxt/druxt.js#62.
    const out = buildLlmsTxt([
      doc({ route: '/api/packages/site', title: 'DruxtSiteMixin', section: 'api' }),
    ], options)

    expect(out).toContain('[Site API]')
    expect(out).not.toContain('DruxtSiteMixin')
  })

  it('does not list individual API pages, only package indexes', () => {
    const out = buildLlmsTxt([
      doc({ route: '/api/packages/druxt', title: 'Druxt', section: 'api' }),
      doc({ route: '/api/packages/druxt/components/DruxtModule', title: 'DruxtModule', section: 'api' }),
    ], options)

    expect(out).toContain('[Druxt API]')
    expect(out).not.toContain('DruxtModule')
  })

  it('omits the Optional section when the API tree has not been generated', () => {
    // content/api is gitignored, so a fresh checkout has none of it.
    const out = buildLlmsTxt([doc()], options)

    expect(out).not.toContain('## Optional')
  })

  it('omits the trailing colon for a document with no description', () => {
    const out = buildLlmsTxt([doc({ description: '' })], options)

    expect(out).toContain('- [Theming](https://example.test/guide/theming?' + UTM + ')\n')
  })

  it('ends with a newline', () => {
    expect(buildLlmsTxt([doc()], options).endsWith('\n')).toBe(true)
  })
})
