import { describe, expect, it } from 'vitest'
import { DRUXT_API_BASE } from '../../packages/core/src/routes'
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
