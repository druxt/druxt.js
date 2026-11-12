import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDruxtAnonymousClient, useDruxtServerClient } from '@druxt/core/server'
import { drupal, index } from '../unit/fake-drupal'

afterEach(() => vi.restoreAllMocks())

// The schema hold, the date format hold and module config reads run on the server's clients.
describe('the server\'s clients, in development', () => {
  it('warn once per resource type when Drupal omits resources from a read', async () => {
    const omitted = { data: [], meta: { omitted: { detail: 'Some resources have been omitted because of insufficient authorization.', links: {} } } }
    vi.stubGlobal('fetch', drupal({ 'GET /jsonapi': index('', ['view--view', 'block--block']), 'GET /jsonapi/view/view': omitted, 'GET /jsonapi/block/block': omitted }).fetch)
    const warnings: string[] = []
    vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => { warnings.push(args.join(' ')) })
    const server = await useDruxtServerClient()
    const anonymous = await useDruxtAnonymousClient()
    expect(server.options.warnOmitted).toBe(true)
    expect(anonymous.options.warnOmitted).toBe(true)
    await server.getCollection('view--view')
    await anonymous.getCollection('block--block')
    expect(warnings.filter((line) => line.includes('DRUXT_E01001') && line.includes('view--view'))).toHaveLength(1)
    expect(warnings.filter((line) => line.includes('DRUXT_E01001') && line.includes('block--block'))).toHaveLength(1)
  })
})
