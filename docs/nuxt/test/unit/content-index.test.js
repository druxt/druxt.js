/**
 * The content index is what sitemap.xml, llms.txt and every page's meta
 * description are derived from, and nothing but a full `nuxt generate` exercised
 * it. These cover the rules that would corrupt all three at once if they
 * regressed, and the cases that were found by hand while building it.
 */

const fs = require('fs')
const os = require('os')
const path = require('path')

const { readContent, routeFor, excerpt, parseFrontmatter } = require('../../lib/content-index')

describe('parseFrontmatter', () => {
  it('reads the three scalar kinds content/ actually uses', () => {
    const { data } = parseFrontmatter('---\ntitle: Theming\nweight: -10\ndescription: How to theme.\n---\n\nBody.\n')

    expect(data).toEqual({ title: 'Theming', weight: -10, description: 'How to theme.' })
  })

  it('returns the body with the fence removed', () => {
    expect(parseFrontmatter('---\ntitle: A\n---\n\nBody.\n').content).toBe('\nBody.\n')
  })

  it('keeps colons that appear after the first one', () => {
    // "Getting started with Druxt.js" is fine, but a title like this one would
    // be truncated by a naive split.
    expect(parseFrontmatter('---\ntitle: Druxt: a decoupled framework\n---\n').data.title)
      .toBe('Druxt: a decoupled framework')
  })

  it('strips matching quotes', () => {
    expect(parseFrontmatter('---\ntitle: "Quoted"\n---\n').data.title).toBe('Quoted')
    expect(parseFrontmatter("---\ntitle: 'Quoted'\n---\n").data.title).toBe('Quoted')
  })

  it('does not strip an apostrophe inside an unquoted value', () => {
    expect(parseFrontmatter("---\ntitle: Druxt's guide\n---\n").data.title).toBe("Druxt's guide")
  })

  it('reads weight as a number, including negatives', () => {
    expect(parseFrontmatter('---\nweight: 5\n---\n').data.weight).toBe(5)
    expect(parseFrontmatter('---\nweight: -10\n---\n').data.weight).toBe(-10)
  })

  it('treats a document with no fence as all body', () => {
    // content/modules/entity/deprecations.md opens straight at a heading.
    const raw = '# Deprecations\n\nText.\n'

    expect(parseFrontmatter(raw)).toEqual({ data: {}, content: raw })
  })

  it('only treats a fence at the very top as frontmatter', () => {
    // A `---` horizontal rule mid-document must not be mistaken for one.
    const raw = 'Intro.\n\n---\ntitle: Not frontmatter\n---\n'

    expect(parseFrontmatter(raw)).toEqual({ data: {}, content: raw })
  })

  it('ignores lines it does not recognise rather than guessing', () => {
    // A nested or list value degrades to absent, which readContent already has
    // a fallback for. It is not a YAML parser and does not pretend to be.
    const { data } = parseFrontmatter('---\ntitle: A\nnested:\n  - one\n---\n')

    expect(data.title).toBe('A')
    expect(data.nested).toBe('')
  })

  it('handles an empty value and empty input', () => {
    expect(parseFrontmatter('---\ntitle:\n---\n').data.title).toBe('')
    expect(parseFrontmatter('')).toEqual({ data: {}, content: '' })
    expect(parseFrontmatter(undefined)).toEqual({ data: {}, content: '' })
  })

  it('handles CRLF line endings', () => {
    expect(parseFrontmatter('---\r\ntitle: A\r\n---\r\nBody.\r\n').data.title).toBe('A')
  })
})

describe('routeFor', () => {
  it('collapses README and index to the parent directory', () => {
    // /modules/entity is what the page serves; /modules/entity/README 404s.
    expect(routeFor('modules/entity/README.md')).toBe('/modules/entity')
    expect(routeFor('api/packages/druxt/index.md')).toBe('/api/packages/druxt')
  })

  it('keeps ordinary documents at their own path', () => {
    expect(routeFor('guide/theming.md')).toBe('/guide/theming')
  })

  it('collapses a top-level index to the site root', () => {
    expect(routeFor('README.md')).toBe('/')
  })

  it('is case insensitive about the extension', () => {
    expect(routeFor('guide/theming.MD')).toBe('/guide/theming')
  })
})

describe('excerpt', () => {
  it('takes the first line of prose', () => {
    expect(excerpt('# Heading\n\nThe first real sentence.\n')).toBe('The first real sentence.')
  })

  it('unwraps a leading blockquote, which is how most module READMEs open', () => {
    expect(excerpt('# Entity\n\n> Drupal Display Mode powered components.\n'))
      .toBe('Drupal Display Mode powered components.')
  })

  it('returns nothing for generated HTML rather than a fragment of markup', () => {
    // content/api/** is jsdoc2md output. Excerpting it line by line produced
    // "wrapper component.</p>", torn out of the middle of a <dd>.
    const body = '# Modules\n\n<dl>\n<dt>DruxtBlocksModule</dt>\n<dd><p>The Nuxt.js module function.</p>\n'
    expect(excerpt(body)).toBe('')
  })

  it('skips maintainer notes', () => {
    // content/guide/deprecations.md opens with exactly this line.
    expect(excerpt('---\n\nTODO: Move to API documentation\n\nReal prose.\n')).toBe('Real prose.')
    expect(excerpt('FIXME: later\n\nReal prose.\n')).toBe('Real prose.')
  })

  it('skips list items, matching the runtime twin', () => {
    // utils/content.js documentDescription only accepts p and blockquote, so
    // without this the build wrote "- first bullet" into llms.txt while the
    // page's own description fell back to the section blurb.
    expect(excerpt('- first bullet\n- second\n')).toBe('')
    expect(excerpt('1. step one\n')).toBe('')
  })

  it('strips markdown syntax but keeps link text', () => {
    expect(excerpt('See the [guide](/guide) for `details` and **more**.'))
      .toBe('See the guide for details and more.')
  })

  it('drops a leading image without dropping the sentence after it', () => {
    expect(excerpt('![screenshot](/img.png)\n\nWhat it does.\n')).toBe('What it does.')
  })

  it('returns an empty string for empty or missing input', () => {
    expect(excerpt('')).toBe('')
    expect(excerpt(undefined)).toBe('')
    expect(excerpt('# Only a heading\n')).toBe('')
  })
})

describe('readContent', () => {
  let dir

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'druxt-content-'))
  })

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
  })

  const write = (relative, contents) => {
    const target = path.join(dir, relative)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, contents)
  }

  it('returns an empty list when the directory does not exist', () => {
    // content/api is generated by docgen and absent from a fresh checkout.
    expect(readContent(path.join(dir, 'nope'))).toEqual([])
  })

  it('reads frontmatter and derives the missing pieces', () => {
    write('guide/theming.md', '---\ntitle: Theming\nweight: 3\n---\n\nHow to theme.\n')

    expect(readContent(dir)).toMatchObject([{
      route: '/guide/theming',
      title: 'Theming',
      description: 'How to theme.',
      weight: 3,
      section: 'guide',
    }])
  })

  it('falls back to a route-derived title when there is no frontmatter', () => {
    // content/modules/entity/deprecations.md has none, and rendered
    // <title>druxtjs-org</title> - the npm package name - before this.
    write('modules/entity/deprecations.md', '# Deprecations\n\nSome text.\n')

    expect(readContent(dir)[0]).toMatchObject({
      route: '/modules/entity/deprecations',
      title: 'Deprecations',
    })
  })

  it('prefers an explicit frontmatter description over the excerpt', () => {
    write('guide/a.md', '---\ntitle: A\ndescription: Written by hand.\n---\n\nExcerpt text.\n')

    expect(readContent(dir)[0].description).toBe('Written by hand.')
  })

  it('ignores non-markdown files', () => {
    write('guide/a.md', '---\ntitle: A\n---\n')
    write('guide/image.png', 'not markdown')

    expect(readContent(dir).map((doc) => doc.route)).toEqual(['/guide/a'])
  })

  it('sorts by route so output is stable between builds', () => {
    write('guide/z.md', '---\ntitle: Z\n---\n')
    write('guide/a.md', '---\ntitle: A\n---\n')

    expect(readContent(dir).map((doc) => doc.route)).toEqual(['/guide/a', '/guide/z'])
  })

  it('defaults weight to 0 when absent or not a number', () => {
    write('guide/a.md', '---\ntitle: A\nweight: heavy\n---\n')

    expect(readContent(dir)[0].weight).toBe(0)
  })
})
