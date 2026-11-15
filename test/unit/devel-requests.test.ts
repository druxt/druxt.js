import { describe, expect, it } from 'vitest'
import { DruxtClient } from '../../packages/client/src'
import { DRUXT_API_BASE } from '../../packages/core/src/routes'
import { captureRequests, requestKind, setRequestRecorder } from '../../packages/core/src/runtime/devel/utils/requests'
import type { DruxtRequestRecord } from '../../packages/core/src/runtime/devel/utils/requests'
import { BASE_URL, drupal } from './fake-drupal'

describe('captureRequests()', () => {
  it('records a response Drupal omitted resources from as partial, with Drupal\'s reason', async () => {
    const detail = 'Some resources have been omitted because of insufficient authorization.'
    const { fetch } = drupal({ 'GET /jsonapi/view/view': { data: [], meta: { omitted: { detail, links: {} } } }, 'GET /jsonapi/node/page': { data: [] } })
    const client = new DruxtClient(BASE_URL, { fetch })
    const records: DruxtRequestRecord[] = []
    setRequestRecorder(client, (record) => records.push(record))
    captureRequests(client, () => 0)
    await client.request('/jsonapi/view/view')
    await client.request('/jsonapi/node/page')
    expect(records.map((record) => [record.path, record.partial])).toEqual([['/jsonapi/view/view', detail], ['/jsonapi/node/page', undefined]])
  })
})

describe('requestKind()', () => {
  // Every route Druxt serves under DRUXT_API_BASE, then Drupal's own requests, each at the JSON:API endpoint a site
  // may set: Drupal's default, and `/api`, which DRUXT_API_BASE sits under.
  const kinds: [string, string][] = [
    [`${DRUXT_API_BASE}/schema/node--page--default--view`, 'schema'],
    [`${DRUXT_API_BASE}/schema/es/node--page--default--view`, 'schema'],
    [`${DRUXT_API_BASE}/date-formats/-`, 'date-formats'],
    [`${DRUXT_API_BASE}/date-formats/es`, 'date-formats'],
    [`${DRUXT_API_BASE}/blocks/olivero/-`, 'other'],
    [`${DRUXT_API_BASE}/blocks/-/es/olivero_branding`, 'other'],
    [`${DRUXT_API_BASE}/auth/token`, 'other'],
    [`${DRUXT_API_BASE}/auth/logout`, 'other'],
    [`${DRUXT_API_BASE}/cache/clear`, 'other'],
    [`${DRUXT_API_BASE}/template`, 'other'],
    [`${DRUXT_API_BASE}/prerender.json`, 'other'],
    ['{endpoint}/entity_view_display/entity_view_display?filter[bundle]=page', 'schema'],
    ['{endpoint}/entity_form_display/entity_form_display', 'schema'],
    ['{endpoint}/field_config/field_config', 'schema'],
    ['{endpoint}/date_format/date_format', 'date-formats'],
    ['{endpoint}', 'jsonapi'],
    ['{endpoint}/node/page?page[limit]=3', 'jsonapi'],
    [`${BASE_URL}{endpoint}/node/page`, 'jsonapi'],
    [`${BASE_URL}/es{endpoint}/node/page`, 'jsonapi'],
    ['/sites/default/files/2026-11/oatmeal.jpg', 'other'],
    [`${BASE_URL}/sites/default/files/styles/large/public/oatmeal.jpg?itok={endpoint}`, 'other'],
    ['/oauth/userinfo', 'other'],
  ]

  for (const endpoint of ['/jsonapi', '/api']) {
    it.each(kinds.map(([url, kind]) => [url.replaceAll('{endpoint}', endpoint), kind]))(`reads %s as %s, with JSON:API at ${endpoint}`, (url, kind) => {
      expect(requestKind(url, endpoint)).toBe(kind)
    })
  }
})
