import { afterEach, describe, expect, it, vi } from 'vitest'

const order = vi.hoisted(() => [] as string[])
const cache = vi.hoisted(() => ({ secret: 'secret' as string | undefined }))

vi.mock('#imports', () => ({ useRuntimeConfig: () => ({ druxt: { cache: { secret: cache.secret } } }) }))
vi.mock('nitropack/runtime', () => ({
  useNitroApp: () => ({ hooks: { callHook: async (name: string) => { order.push(`callHook:${name}`) } } }),
}))
vi.mock('@druxt/client', () => ({ resetProcessCache: () => order.push('resetProcessCache') }))
vi.mock('../../packages/core/src/runtime/server/signIn', () => ({ clearServerClients: async () => { order.push('clearServerClients') } }))

afterEach(() => {
  cache.secret = 'secret'
})

describe('POST /api/_druxt/cache/clear', () => {
  it('resets the process cache, then the server clients, then tells the modules', async () => {
    const { default: handler } = await import('../../packages/core/src/runtime/server/routes/cacheClear')
    const event = { method: 'POST', node: { req: { headers: { 'x-druxt-secret': 'secret' } }, res: { statusCode: 200, setHeader: () => {} } } }
    await (handler as unknown as (e: unknown) => Promise<unknown>)(event)
    expect(order).toEqual(['resetProcessCache', 'clearServerClients', 'callHook:druxt:cache:clear'])
  })

  it('answers 405 with an Allow header to any other method, and clears nothing', async () => {
    const { default: handler } = await import('../../packages/core/src/runtime/server/routes/cacheClear')
    for (const method of ['GET', 'PUT', 'DELETE']) {
      order.length = 0
      const headers: Record<string, string> = {}
      const res = { statusCode: 200, setHeader: (name: string, value: string) => { headers[name.toLowerCase()] = value } }
      const event = { method, node: { req: { headers: { 'x-druxt-secret': 'secret' } }, res } }
      await (handler as unknown as (e: unknown) => Promise<unknown>)(event)
      expect(res.statusCode, method).toBe(405)
      expect(headers.allow, method).toBe('POST')
      expect(order, method).toEqual([])
    }
  })

  // Registered while the secret may still arrive at runtime: with none, the route is not there, whatever is sent.
  it.each([undefined, ''])('answers 404 to every request with the secret %j, and clears nothing', async (secret) => {
    cache.secret = secret
    const { default: handler } = await import('../../packages/core/src/runtime/server/routes/cacheClear')
    for (const method of ['POST', 'GET']) {
      for (const headers of [{}, { 'x-druxt-secret': '' }, { 'x-druxt-secret': 'secret' }]) {
        order.length = 0
        const sent: Record<string, string> = {}
        const res = { statusCode: 200, setHeader: (name: string, value: string) => { sent[name.toLowerCase()] = value } }
        const body = await (handler as unknown as (e: unknown) => Promise<unknown>)({ method, node: { req: { headers }, res } })
        expect(res.statusCode, `${method} ${JSON.stringify(headers)}`).toBe(404)
        expect(body).toBe('')
        expect(sent).not.toHaveProperty('allow')
        expect(order).toEqual([])
      }
    }
  })
})
