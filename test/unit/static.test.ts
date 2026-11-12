import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyFiles, fileCollector, prerenderCollector, prerenderPaths, readPrerenderPages, redirectOf, resolveStatic } from '../../packages/core/src/utils/static'
import type { DruxtClient } from '@druxt/client'

describe('resolveStatic()', () => {
  it('follows nitro.static unless druxt.static says otherwise', () => {
    expect(resolveStatic(undefined, true)).toEqual({ enabled: true, routes: true, files: false, hybrid: false })
    expect(resolveStatic(undefined, false)).toEqual({ enabled: false, routes: false, files: false, hybrid: false })
    expect(resolveStatic(false, true)).toEqual({ enabled: false, routes: false, files: false, hybrid: false })
    expect(resolveStatic(true, false)).toEqual({ enabled: true, routes: true, files: false, hybrid: false })
    expect(resolveStatic({ files: true }, true)).toEqual({ enabled: true, routes: true, files: true, hybrid: false })
    expect(resolveStatic({ routes: false }, true)).toEqual({ enabled: true, routes: false, files: false, hybrid: false })
    expect(resolveStatic({ hybrid: true }, true)).toEqual({ enabled: true, routes: true, files: false, hybrid: true })
  })
})

describe('the prerender manifest', () => {
  it('reads a prerendered redirect page\'s target', () => {
    expect(redirectOf('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=/en"></head></html>')).toBe('/en')
    expect(redirectOf('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=/en/a%20b?x=1&amp;y=2"></head></html>')).toBe('/en/a%20b?x=1&y=2')
    expect(redirectOf('<html><head><title>Page</title></head><body>url=/en</body></html>')).toBeUndefined()
  })

  it('lists the pages it generated and the redirects it wrote, without the fallbacks, payloads or failures', () => {
    const collect = prerenderCollector()
    collect.add({ route: '/', fileName: '/index.html', contents: '<html>Home</html>' })
    collect.add({ route: '/_payload.json', fileName: '/_payload.json', contents: '[]' })
    collect.add({ route: '/200.html', fileName: '/200.html', contents: '<html></html>' })
    collect.add({ route: '/404.html', fileName: '/404.html', contents: '<html></html>' })
    collect.add({ route: '/node', fileName: '/node/index.html', contents: '<html><head><meta http-equiv="refresh" content="0; url=/en"></head></html>' })
    collect.add({ route: '/en/recipes/a', fileName: '/en/recipes/a/index.html', contents: '<html>A</html>' })
    collect.add({ route: '/broken', fileName: '/broken/index.html', contents: '<html>500</html>', error: new Error('500') })
    expect(collect.manifest()).toEqual({ routes: ['/', '/en/recipes/a'], redirects: { '/node': '/en' } })
  })
})

describe('the files a static build copies', () => {
  it('collects each site-relative path in Drupal\'s public files from a page and its payload, once, with its query', () => {
    const files = fileCollector('/')
    files.scan('<img src="/sites/default/files/a.jpg" srcset="/sites/default/files/styles/wide/public/a.jpg?itok=x 1x, /sites/default/files/styles/wide/public/a.jpg?itok=x 2x"><a href="/sites/default/files/b%20c.pdf">b</a><img src="http://drupal.test/sites/default/files/absolute.jpg"><a href="/system/files/private.pdf">p</a>')
    files.scan('["/sites/default/files/a.jpg","/sites/default/files/d.png?x=1&amp;y=2","text /sites/default/files/a.jpg"]')
    expect(files.files).toEqual([
      { file: '/sites/default/files/a.jpg', request: '/sites/default/files/a.jpg' },
      { file: '/sites/default/files/b%20c.pdf', request: '/sites/default/files/b%20c.pdf' },
      { file: '/sites/default/files/d.png', request: '/sites/default/files/d.png?x=1&y=2' },
      { file: '/sites/default/files/styles/wide/public/a.jpg', request: '/sites/default/files/styles/wide/public/a.jpg?itok=x' },
    ])
  })

  it('reads the paths under the app\'s base URL', () => {
    const files = fileCollector('/docs/')
    files.scan('<img src="/docs/sites/default/files/a.jpg"><img src="/sites/default/files/b.jpg">')
    expect(files.files.map((file) => file.file)).toEqual(['/sites/default/files/a.jpg'])
  })

  describe('copyFiles()', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('writes each file Drupal answers into the output, decoded, without its query, and warns about the rest', async () => {
      const publicDir = mkdtempSync(join(tmpdir(), 'druxt-static-'))
      const requested: string[] = []
      vi.stubGlobal('fetch', vi.fn(async (url: string) => {
        requested.push(url)
        if (url.endsWith('/missing.png')) return new Response('', { status: 404 })
        return new Response(Buffer.from(`file ${url}`), { status: 200 })
      }))
      const warnings: string[] = []
      const copied = await copyFiles([
        { file: '/sites/default/files/a%20b.jpg', request: '/sites/default/files/a%20b.jpg' },
        { file: '/sites/default/files/styles/wide/public/a.jpg', request: '/sites/default/files/styles/wide/public/a.jpg?itok=x' },
        { file: '/sites/default/files/missing.png', request: '/sites/default/files/missing.png' },
        { file: '/sites/default/files/../../../../outside.txt', request: '/sites/default/files/../../../../outside.txt' },
      ], { origin: 'http://drupal.test/', publicDir, warn: (message) => warnings.push(message), concurrency: 2 })
      expect(copied).toBe(2)
      expect(readFileSync(join(publicDir, 'sites/default/files/a b.jpg'), 'utf8')).toBe('file http://drupal.test/sites/default/files/a%20b.jpg')
      expect(existsSync(join(publicDir, 'sites/default/files/styles/wide/public/a.jpg'))).toBe(true)
      expect(requested).toContain('http://drupal.test/sites/default/files/styles/wide/public/a.jpg?itok=x')
      expect(warnings).toHaveLength(2)
      expect(warnings[0]).toMatch(/^DRUXT_E01005: \/sites\/default\/files\/missing\.png was not copied .* Drupal answered 404/)
      expect(warnings[1]).toContain('leaves the output directory')
      expect(requested.some((url) => url.includes('outside'))).toBe(false)
    })
  })
})

describe('the pages a static build prerenders', () => {
  const languages = [{ langcode: 'en', prefix: 'en', default: true as const }, { langcode: 'es', prefix: 'es' }]

  it('lists each language\'s root and each page under its language\'s prefix, at its alias or its system path', () => {
    expect(prerenderPaths(languages, [
      { alias: '/recipes/a', system: '/node/1', langcode: 'en' },
      { alias: '/recipes/a-es', system: '/node/1', langcode: 'es' },
      { alias: null, system: '/node/2', langcode: 'en' },
      { alias: '/tags/x', system: '/taxonomy/term/3', langcode: 'und' },
      { alias: null, system: '/taxonomy/term/', langcode: 'en' },
      { alias: '/recipes/a', system: '/node/1', langcode: 'en' },
    ])).toEqual(['/', '/en', '/en/node/2', '/en/recipes/a', '/en/tags/x', '/es', '/es/recipes/a-es'])
  })

  it('lists a one-language site unprefixed', () => {
    expect(prerenderPaths([], [{ alias: '/about', system: '/node/1', langcode: 'en' }])).toEqual(['/', '/about'])
    expect(prerenderPaths([{ langcode: 'en', prefix: '', default: true }], [{ alias: '/about', system: '/node/1', langcode: 'en' }])).toEqual(['/', '/about'])
  })

  it('reads the published nodes and terms of the types the index lists, under each prefix, in their own language only', async () => {
    const calls: Array<{ type: string, query: Record<string, unknown>, prefix: string }> = []
    const rows: Record<string, Array<Record<string, unknown>>> = {
      '/en node--recipe': [{ langcode: 'en', path: { alias: '/recipes/a' }, drupal_internal__nid: 1 }],
      '/es node--recipe': [{ langcode: 'es', path: { alias: '/recipes/a-es' }, drupal_internal__nid: 1 }, { langcode: 'en', path: { alias: '/recipes/b' }, drupal_internal__nid: 2 }],
      '/en taxonomy_term--tags': [{ langcode: 'en', path: { alias: null }, drupal_internal__tid: 3 }],
      '/es taxonomy_term--tags': [],
    }
    const client = {
      getIndex: async () => ({ 'node--recipe': {}, 'taxonomy_term--tags': {}, 'media--image': {}, 'node_type--node_type': {} }),
      getCollectionAll: async (type: string, query: { getQueryObject: () => Record<string, unknown> }, prefix: string) => {
        calls.push({ type, query: query.getQueryObject(), prefix })
        return [{ data: (rows[`${prefix} ${type}`] || []).map((attributes) => ({ type, id: String(attributes.drupal_internal__nid || attributes.drupal_internal__tid), attributes })) }]
      },
    } as unknown as DruxtClient
    const pages = await readPrerenderPages(client, languages)
    expect(pages).toEqual([
      { alias: '/recipes/a', system: '/node/1', langcode: 'en' },
      { alias: null, system: '/taxonomy/term/3', langcode: 'en' },
      { alias: '/recipes/a-es', system: '/node/1', langcode: 'es' },
    ])
    expect(calls.map((call) => `${call.prefix} ${call.type}`).sort()).toEqual(Object.keys(rows).sort())
    expect(calls[0]!.query).toMatchObject({ fields: { 'node--recipe': 'path,langcode,drupal_internal__nid' }, filter: { status: '1' } })
  })

  it('fails, naming each type and language it could not list, rather than leave their pages out of the build', async () => {
    const client = {
      getIndex: async () => ({ 'node--recipe': {}, 'node--page': {}, 'taxonomy_term--tags': {} }),
      getCollectionAll: async (type: string, _query: unknown, prefix: string) => {
        if (`${prefix} ${type}` === '/es node--recipe') throw new Error('Request failed with status code 502')
        if (`${prefix} ${type}` === '/en taxonomy_term--tags') throw new Error('Request failed with status code 403')
        return [{ data: [] }]
      },
    } as unknown as DruxtClient
    const read = readPrerenderPages(client, languages)
    await expect(read).rejects.toThrow('node--recipe under /es (es): Request failed with status code 502')
    await expect(read).rejects.toThrow('taxonomy_term--tags under /en (en): Request failed with status code 403')
    await expect(read).rejects.toThrow(/^\[druxt\] The static build could not list Drupal's published pages/)
  })

  it('names a one-language site\'s failed read as unprefixed', async () => {
    const client = {
      getIndex: async () => ({ 'node--page': {} }),
      getCollectionAll: async () => { throw new Error('Request failed with status code 500') },
    } as unknown as DruxtClient
    await expect(readPrerenderPages(client, [])).rejects.toThrow('node--page, unprefixed: Request failed with status code 500')
  })
})
