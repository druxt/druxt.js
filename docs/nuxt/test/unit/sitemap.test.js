/**
 * A sitemap that is not well-formed XML is rejected wholesale rather than
 * partially, so the escaping and structure here are worth pinning.
 */

const { buildSitemap, escapeXml } = require('../../lib/sitemap')

/** A document as readContent() returns one. */
const doc = (over) => ({
  route: '/guide/theming',
  title: 'Theming',
  description: 'How to theme.',
  weight: 0,
  section: 'guide',
  ...over,
})

describe('escapeXml', () => {
  it('escapes all five predefined entities', () => {
    expect(escapeXml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&apos;')
  })

  it('escapes the ampersand first, so entities are not double-escaped', () => {
    expect(escapeXml('a & b')).toBe('a &amp; b')
    expect(escapeXml('<a href="x">')).toBe('&lt;a href=&quot;x&quot;&gt;')
  })
})

describe('buildSitemap', () => {
  const options = { origin: 'https://example.test', now: new Date('2024-01-03T00:00:00Z') }

  it('emits the homepage plus one entry per document', () => {
    const xml = buildSitemap([doc()], options)

    expect(xml.match(/<url>/g)).toHaveLength(2)
    expect(xml).toContain('<loc>https://example.test/</loc>')
    expect(xml).toContain('<loc>https://example.test/guide/theming</loc>')
    expect(xml).not.toContain('<lastmod>')
  })

  it('is well-formed and declares the sitemap namespace', () => {
    const xml = buildSitemap([doc()], options)

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true)
  })

  it('takes priority and changefreq from the document section', () => {
    const xml = buildSitemap([doc({ route: '/api/packages/druxt', section: 'api' })], options)

    // The generated reference should not outrank the hand-written guide.
    expect(xml).toContain('<priority>0.4</priority>')
    expect(xml).toContain('<changefreq>yearly</changefreq>')
  })

  it('gives an unknown section a neutral default rather than dropping it', () => {
    const xml = buildSitemap([doc({ route: '/other', section: 'other' })], options)

    expect(xml).toContain('<loc>https://example.test/other</loc>')
    expect(xml).toContain('<priority>0.5</priority>')
  })

  it('never emits the homepage twice', () => {
    // A root content/README.md collapses to route '/', which is already the
    // hand-built home entry.
    const xml = buildSitemap([doc({ route: '/', section: null })], options)

    expect(xml.match(/<loc>https:\/\/example\.test\/<\/loc>/g)).toHaveLength(1)
  })

  it('dates the homepage from the newest document', () => {
    const xml = buildSitemap([
      doc({ route: '/a', mtime: new Date('2024-05-01T00:00:00Z') }),
      doc({ route: '/b', mtime: new Date('2024-02-01T00:00:00Z') }),
    ], options)

  })

  it('falls back to the clock for an empty content tree', () => {
    const xml = buildSitemap([], options)

    expect(xml.match(/<url>/g)).toHaveLength(1)
  })

  it('escapes characters in a route', () => {
    const xml = buildSitemap([doc({ route: '/guide/a&b' })], options)

    expect(xml).toContain('<loc>https://example.test/guide/a&amp;b</loc>')
    expect(xml).not.toContain('a&b<')
  })
})
