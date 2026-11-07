import { describe, expect, it } from 'vitest'
import { BASE_URL } from './backend'

describe('the standalone backend', () => {
  it('the backend answers /jsonapi as JSON:API', async () => {
    const response = await fetch(`${BASE_URL}/jsonapi`)
    expect(response.headers.get('content-type')).toContain('application/vnd.api+json')
  })
})
