/**
 * seoHead is the only source of every page's canonical URL and share card since
 * nuxt-social-meta was removed, so the exact tag set is worth pinning: a
 * dropped hid silently un-dedupes a tag, and a dropped tag silently breaks a
 * share preview.
 */

import { clampDescription, descriptionFor, seoHead } from '../../utils/seo'
import { canonicalUrl, normalisePath, sectionFor, titleFromPath } from '../../lib/site'

/** Look up one meta tag's content by hid. */
const content = (head, hid) => (head.meta.find((tag) => tag.hid === hid) || {}).content

describe('normalisePath', () => {
  it('strips a trailing slash but keeps the root', () => {
    expect(normalisePath('/guide/')).toBe('/guide')
    expect(normalisePath('/')).toBe('/')
    expect(normalisePath('')).toBe('/')
  })

  it('adds the leading slash', () => {
    expect(normalisePath('guide')).toBe('/guide')
  })
})

describe('canonicalUrl', () => {
  it('collapses the trailing-slash variant onto one absolute URL', () => {
    expect(canonicalUrl('/how-to/theming/')).toBe('https://druxtjs.org/how-to/theming')
    expect(canonicalUrl('/how-to/theming')).toBe('https://druxtjs.org/how-to/theming')
  })

  it('keeps the root slash', () => {
    expect(canonicalUrl('/')).toBe('https://druxtjs.org/')
  })
})

describe('sectionFor', () => {
  it('identifies the documentation sections', () => {
    expect(sectionFor('/how-to/theming')).toBe('how-to')
    expect(sectionFor('/api/packages/druxt')).toBe('api')
  })

  it('returns null for the homepage and unknown sections', () => {
    expect(sectionFor('/')).toBeNull()
    expect(sectionFor('/nope')).toBeNull()
  })
})

describe('titleFromPath', () => {
  it('humanises the last segment', () => {
    expect(titleFromPath('/tutorials/getting-started')).toBe('Getting started')
    expect(titleFromPath('/modules/entity/deprecations')).toBe('Deprecations')
  })

  it('returns an empty string at the root', () => {
    expect(titleFromPath('/')).toBe('')
  })
})

describe('clampDescription', () => {
  it('leaves a short description alone', () => {
    expect(clampDescription('Short.')).toBe('Short.')
  })

  it('collapses whitespace', () => {
    expect(clampDescription('  a\n  b  ')).toBe('a b')
  })

  it('keeps a description exactly at the limit intact', () => {
    const exact = 'a'.repeat(160)
    expect(clampDescription(exact)).toBe(exact)
  })

  it('truncates on a word boundary past the limit', () => {
    const long = ('word '.repeat(50)).trim()
    const out = clampDescription(long)

    expect(out.endsWith('…')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(161)
    expect(out).not.toContain('wor…')
  })

  it('hard-cuts a single word longer than the limit', () => {
    // lastSpace is -1 here, so the word-boundary branch cannot apply.
    const out = clampDescription('a'.repeat(200))

    expect(out).toBe('a'.repeat(160) + '…')
  })

  it('handles empty and missing input', () => {
    expect(clampDescription('')).toBe('')
    expect(clampDescription(undefined)).toBe('')
  })
})

describe('descriptionFor', () => {
  it('prefers the document description', () => {
    expect(descriptionFor({ description: 'Specific.', path: '/guide/a' })).toBe('Specific.')
  })

  it('falls back to the section, not the site blurb', () => {
    // 98 generated API pages have no prose to excerpt; saying what the section
    // is beats repeating the homepage description on all of them.
    expect(descriptionFor({ path: '/api/packages/druxt' }))
      .toContain('generated from the package source')
  })

  it('falls back to the site description off-section', () => {
    expect(descriptionFor({ path: '/' })).toContain('fully decoupled Drupal')
  })
})

describe('seoHead', () => {
  const head = seoHead({ title: 'Theming', description: 'How to theme.', path: '/how-to/theming' })

  it('declares exactly one canonical URL', () => {
    expect(head.link.filter((tag) => tag.rel === 'canonical')).toHaveLength(1)
    expect(head.link[0].href).toBe('https://druxtjs.org/how-to/theming')
  })

  it('emits the full share-card set that nuxt-social-meta used to supply', () => {
    const hids = head.meta.map((tag) => tag.hid)

    expect(hids).toEqual(expect.arrayContaining([
      'description',
      'og:type', 'og:title', 'og:description', 'og:url', 'og:image', 'og:site_name',
      'og:image:width', 'og:image:height',
      'twitter:card', 'twitter:site', 'twitter:title', 'twitter:description', 'twitter:image',
    ]))
  })

  it('gives every tag a hid, which is what prevents duplicates', () => {
    expect(head.meta.every((tag) => typeof tag.hid === 'string' && tag.hid)).toBe(true)
    expect(new Set(head.meta.map((tag) => tag.hid)).size).toBe(head.meta.length)
  })

  it('suffixes the share title but not the page title', () => {
    // <title> gets the suffix from head.titleTemplate; og:title stands alone in
    // a share card with no browser chrome to say which site it came from.
    expect(head.title).toBe('Theming')
    expect(content(head, 'og:title')).toBe('Theming - DruxtJS')
  })

  it('defaults to the article type and allows an override', () => {
    expect(content(head, 'og:type')).toBe('article')
    expect(content(seoHead({ title: null, path: '/', type: 'website' }), 'og:type')).toBe('website')
  })

  it('derives a title for a document that has none', () => {
    // content/modules/entity/deprecations.md has no frontmatter at all.
    const derived = seoHead({ title: null, path: '/modules/entity/deprecations' })

    expect(derived.title).toBe('Deprecations')
    expect(content(derived, 'og:title')).toBe('Deprecations - DruxtJS')
  })

  it('leaves the homepage title to the page itself', () => {
    const home = seoHead({ title: null, path: '/', type: 'website' })

    expect(home.title).toBeUndefined()
    expect(content(home, 'og:title')).toBe('DruxtJS')
  })

  it('serves the generated card for section pages and falls back to the site card', () => {
    expect(content(head, 'og:image')).toBe('https://druxtjs.org/og/how-to/theming.png')

    const home = seoHead({ title: null, path: '/', type: 'website' })
    expect(content(home, 'og:image')).toBe('https://druxtjs.org/og/site.png')
    expect(content(seoHead({ title: 'A', path: '/a', image: 'https://x.test/a.png' }), 'og:image'))
      .toBe('https://x.test/a.png')
  })

  test('a caller-supplied image carries no dimension claims', () => {
    const head = seoHead({ title: 'x', description: 'y', path: '/guide', image: 'https://example.test/card.jpg' })
    expect(content(head, 'og:image')).toBe('https://example.test/card.jpg')
    expect(head.meta.find((o) => o.hid === 'og:image:width')).toBeUndefined()
    expect(head.meta.find((o) => o.hid === 'og:image:height')).toBeUndefined()
  })

  it('uses the same summary for description, og and twitter', () => {
    expect(content(head, 'description')).toBe('How to theme.')
    expect(content(head, 'og:description')).toBe('How to theme.')
    expect(content(head, 'twitter:description')).toBe('How to theme.')
  })

  it('canonicalises the URL it advertises', () => {
    expect(content(seoHead({ title: 'A', path: '/guide/a/' }), 'og:url'))
      .toBe('https://druxtjs.org/guide/a')
  })
})

describe('SITE_ORIGIN', () => {
  const load = () => {
    jest.resetModules()
    return require('~/lib/site').SITE_ORIGIN
  }

  afterEach(() => {
    delete process.env.SITE_ORIGIN
    delete process.env.LAGOON_ENVIRONMENT_TYPE
    delete process.env.LAGOON_ROUTE
  })

  test('an explicit override wins over everything', () => {
    process.env.SITE_ORIGIN = 'https://tunnel.example'
    process.env.LAGOON_ENVIRONMENT_TYPE = 'development'
    process.env.LAGOON_ROUTE = 'https://preview.example'
    expect(load()).toBe('https://tunnel.example')
  })

  test('a Lagoon route alone does not change the baked origin', () => {
    // Routes are runtime-only in Lagoon; scripts/start.sh owns the preview
    // origin. Baking a route here would silently diverge from that.
    process.env.LAGOON_ENVIRONMENT_TYPE = 'development'
    process.env.LAGOON_ROUTE = 'https://pr.druxtjs-org.au2.amazee.io'
    expect(load()).toBe('https://druxtjs.org')
  })

  test('nothing set means the canonical domain', () => {
    expect(load()).toBe('https://druxtjs.org')
  })
})
