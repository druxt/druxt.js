import { describe, expect, it } from 'vitest'
import { DRUXT_API_BASE, normalEndpoint, trimEndSlashes, trimStartSlashes } from '../../packages/core/src/routes'
import { druxtApiConflict } from '../../packages/core/src/utils/routes'

describe('Druxt\'s own routes', () => {
  it('sit under /api/_druxt', () => {
    expect(DRUXT_API_BASE).toBe('/api/_druxt')
  })

  it('leave a JSON:API at /jsonapi, at /api or beside the base path alone', () => {
    expect(druxtApiConflict({ endpoints: ['/jsonapi', '/es/jsonapi'] })).toBeUndefined()
    expect(druxtApiConflict({ endpoints: ['/api', '/es/api'], files: ['/sites/default/files'] })).toBeUndefined()
    expect(druxtApiConflict({ endpoints: ['/api/_druxtjs', '/api/druxt'] })).toBeUndefined()
  })

  it('clash with an endpoint at or under the base path, under a language prefix or none', () => {
    for (const endpoints of [['/api/_druxt'], ['/api/_druxt/'], ['/api/_druxt/jsonapi'], ['/jsonapi', '/api/_druxt']]) {
      expect(druxtApiConflict({ endpoints }), endpoints.join()).toMatch(/^DRUXT_E01006: Drupal's JSON:API is at \/api\/_druxt/)
    }
  })

  it('clash with a proxied files directory the base path sits in, or that sits in it', () => {
    expect(druxtApiConflict({ endpoints: ['/jsonapi'], files: ['/api'] })).toMatch(/^DRUXT_E01006: druxt\.proxy\.files serves \/api,/)
    expect(druxtApiConflict({ endpoints: ['/jsonapi'], files: ['/api/_druxt/files'] })).toMatch(/^DRUXT_E01006: druxt\.proxy\.files/)
  })
})

describe('trimEndSlashes() and trimStartSlashes()', () => {
  it('cut the slashes from one end, and nothing else', () => {
    expect(trimEndSlashes('https://example.com//')).toBe('https://example.com')
    expect(trimEndSlashes('/a/b/')).toBe('/a/b')
    expect(trimEndSlashes('/')).toBe('')
    expect(trimEndSlashes('')).toBe('')
    expect(trimStartSlashes('//a/b/')).toBe('a/b/')
    expect(trimStartSlashes('a')).toBe('a')
  })

  it('take a long run of slashes in a moment', () => {
    const run = `a${'/'.repeat(200_000)}b`
    const start = performance.now()
    expect(trimEndSlashes(run)).toBe(run)
    expect(trimEndSlashes(`a${'/'.repeat(200_000)}`)).toBe('a')
    expect(performance.now() - start).toBeLessThan(250)
  })
})

describe('normalEndpoint()', () => {
  it('gives an endpoint one spelling, however the site writes it', () => {
    expect(normalEndpoint('/jsonapi/')).toBe('/jsonapi')
    expect(normalEndpoint('jsonapi')).toBe('/jsonapi')
    expect(normalEndpoint('api//')).toBe('/api')
    expect(normalEndpoint('/a/b')).toBe('/a/b')
    expect(normalEndpoint('')).toBe('/jsonapi')
    expect(normalEndpoint()).toBe('/jsonapi')
  })
})
