import { describe, expect, it } from 'vitest'
import { resolveFileUrl, resolveFileUrlsInHtml } from '../../packages/core/src/files'

const baseUrl = 'https://drupal.example.com'
const path = '/sites/default/files/logo.png'

describe('resolveFileUrl()', () => {
  it('keeps a path in the proxied files directory on the site, with proxy.files on', () => {
    expect(resolveFileUrl(path, { baseUrl, proxyFiles: true })).toEqual({ url: path, rewritten: false })
    expect(resolveFileUrl('/sites/example/files/a.pdf', { baseUrl, proxyFiles: 'example' })).toEqual({ url: '/sites/example/files/a.pdf', rewritten: false })
  })

  it('makes a path absolute on Drupal\'s base URL with proxy.files off, or outside the proxied directory', () => {
    expect(resolveFileUrl(path, { baseUrl })).toEqual({ url: `${baseUrl}${path}`, rewritten: true })
    expect(resolveFileUrl(path, { baseUrl, proxyFiles: false })).toEqual({ url: `${baseUrl}${path}`, rewritten: true })
    expect(resolveFileUrl('/system/files/private.pdf', { baseUrl, proxyFiles: true })).toEqual({ url: `${baseUrl}/system/files/private.pdf`, rewritten: true })
    expect(resolveFileUrl(path, { baseUrl, proxyFiles: 'example' }).rewritten).toBe(true)
  })

  it('makes it absolute on filesUrl when set', () => {
    expect(resolveFileUrl(path, { baseUrl, filesUrl: 'https://cdn.example.com' }).url).toBe(`https://cdn.example.com${path}`)
  })

  it('makes it absolute on a static build, whatever proxy.files says', () => {
    expect(resolveFileUrl(path, { baseUrl, proxyFiles: true, static: true })).toEqual({ url: `${baseUrl}${path}`, rewritten: true })
    expect(resolveFileUrl(path, { baseUrl, filesUrl: 'https://cdn.example.com', proxyFiles: true, static: true }).url).toBe(`https://cdn.example.com${path}`)
  })

  it('leaves an absolute or protocol-relative URL as it is', () => {
    for (const url of ['https://cdn.example.com/a.png', '//cdn.example.com/a.png', 'data:image/png;base64,AA', '']) {
      expect(resolveFileUrl(url, { baseUrl }), url).toEqual({ url, rewritten: false })
    }
  })
})

describe('resolveFileUrlsInHtml()', () => {
  const body = '<p>Logo: <img src="/sites/default/files/inline-images/logo.png" alt="Logo" data-entity-type="file"> and <a href=\'/sites/default/files/brochure.pdf\'>the brochure</a>, <a href="/about">about</a>, <img src="https://cdn.example.com/x.png"> and <img src="/system/files/private.png"></p>'
  const resolve = (options: Parameters<typeof resolveFileUrl>[1]) => (url: string) => resolveFileUrl(url, options).url

  it('resolves each src and href under the files path, and leaves the rest of the markup byte for byte', () => {
    expect(resolveFileUrlsInHtml(body, resolve({ baseUrl }))).toBe(body
      .replace('"/sites/default/files/inline-images/logo.png"', `"${baseUrl}/sites/default/files/inline-images/logo.png"`)
      .replace('\'/sites/default/files/brochure.pdf\'', `'${baseUrl}/sites/default/files/brochure.pdf'`)
      .replace('"/system/files/private.png"', `"${baseUrl}/system/files/private.png"`))
  })

  it('keeps proxied files on the site, and makes them absolute on filesUrl or on a static build', () => {
    const proxied = resolveFileUrlsInHtml(body, resolve({ baseUrl, proxyFiles: true }))
    expect(proxied).toContain('src="/sites/default/files/inline-images/logo.png"')
    expect(proxied).toContain(`src="${baseUrl}/system/files/private.png"`)
    expect(resolveFileUrlsInHtml(body, resolve({ baseUrl, filesUrl: 'https://cdn.example.com' }))).toContain('src="https://cdn.example.com/sites/default/files/inline-images/logo.png"')
    expect(resolveFileUrlsInHtml(body, resolve({ baseUrl, proxyFiles: true, static: true }))).toContain(`src="${baseUrl}/sites/default/files/inline-images/logo.png"`)
  })

  it('leaves a path outside the files directories, and an attribute that only ends in src, alone', () => {
    const other = '<img data-src="/sites/default/files/a.png"><a href="/sites/default/about">x</a>'
    expect(resolveFileUrlsInHtml(other, resolve({ baseUrl }))).toBe(other)
  })
})

describe('resolveFileUrl() with druxt.static.files', () => {
  it('keeps a public file on the site on a static build, under the app\'s base URL, as the build copied it', () => {
    expect(resolveFileUrl(path, { baseUrl, static: true, staticFiles: true })).toEqual({ url: path, rewritten: false })
    expect(resolveFileUrl(path, { baseUrl, static: true, staticFiles: true, appBaseURL: '/' })).toEqual({ url: path, rewritten: false })
    expect(resolveFileUrl(path, { baseUrl, static: true, staticFiles: true, appBaseURL: '/docs/' })).toEqual({ url: `/docs${path}`, rewritten: true })
    expect(resolveFileUrl('/sites/example/files/a.pdf', { baseUrl, static: true, staticFiles: true, filesUrl: 'https://cdn.example.com' }).url).toBe('/sites/example/files/a.pdf')
  })

  it('still makes a private file absolute, and ignores the option off a static build', () => {
    expect(resolveFileUrl('/system/files/private.pdf', { baseUrl, static: true, staticFiles: true })).toEqual({ url: `${baseUrl}/system/files/private.pdf`, rewritten: true })
    expect(resolveFileUrl(path, { baseUrl, staticFiles: true })).toEqual({ url: `${baseUrl}${path}`, rewritten: true })
    expect(resolveFileUrl(path, { baseUrl, proxyFiles: true, staticFiles: true })).toEqual({ url: path, rewritten: false })
  })
})
