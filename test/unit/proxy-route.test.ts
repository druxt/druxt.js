import { PassThrough } from 'node:stream'
import { ServerResponse } from 'node:http'
import { createApp, createEvent, createRouter, toWebHandler } from 'h3'
import type { EventHandler } from 'h3'
import { afterEach, describe, expect, it, vi } from 'vitest'

const runtime = vi.hoisted(() => ({ config: {} as Record<string, unknown> }))

vi.mock('#imports', () => ({ useRuntimeConfig: () => runtime.config }))
// The proxied routes, as the build wrote them: a test that mounts the proxy elsewhere changes the list in place.
const proxied = vi.hoisted(() => ['/jsonapi/**'])
vi.mock('#druxt/proxy-routes', () => ({ default: proxied }))

/** A request to a route served alone, as Nitro serves it. */
const serve = async (route: string, file: string) => {
  const handler = (await import(file)).default as EventHandler
  const app = createApp().use(createRouter().get(route, handler))
  return toWebHandler(app)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the proxy route', () => {
  it('answers 502, not 500, for a runtime base URL that is not a URL', async () => {
    runtime.config = { public: { druxt: { baseUrl: 'not a url' } }, druxt: {} }
    const handle = await serve('/jsonapi/**', '../../packages/core/src/runtime/server/routes/proxy')
    const response = await handle(new Request('http://site.test/jsonapi/node/page'))
    expect(response.status).toBe(502)
    expect(await response.json()).toMatchObject({ statusCode: 502, statusMessage: 'Bad Gateway' })
  })

  it('refuses a path outside the proxied routes with a 400', async () => {
    runtime.config = { public: { druxt: { baseUrl: 'http://drupal.test' } }, druxt: {} }
    const handle = await serve('/jsonapi/**', '../../packages/core/src/runtime/server/routes/proxy')
    expect((await handle(new Request('http://site.test/jsonapi/..%2fuser/login'))).status).toBe(400)
  })

  // The browser writes its own Cookie header: one that does not decode is no token, never an error.
  it.each(['%', '%E0%A4%A', '%ED%A0%80'])('proxies a request whose token cookie is %s anonymously', async (value) => {
    runtime.config = { public: { druxt: { baseUrl: 'http://drupal.test', auth: { session: true } } }, druxt: {} }
    const sent: Headers[] = []
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      sent.push(new Headers(init.headers))
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/vnd.api+json' } })
    }))
    const handle = await serve('/jsonapi/**', '../../packages/core/src/runtime/server/routes/proxy')
    const response = await handle(new Request('http://site.test/jsonapi/node/page', { headers: { cookie: `druxt.auth.access_token=${value}` } }))
    expect(response.status).toBe(200)
    expect(sent).toHaveLength(1)
    expect(sent[0]!.has('authorization')).toBe(false)
  })

  it('sends Drupal neither the Connection header nor a header it names', async () => {
    runtime.config = { public: { druxt: { baseUrl: 'http://drupal.test' } }, druxt: {} }
    const sent: Headers[] = []
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      sent.push(new Headers(init.headers))
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/vnd.api+json' } })
    }))
    const handler = (await import('../../packages/core/src/runtime/server/routes/proxy')).default as EventHandler
    // The request as Node hands it over: a web Request refuses a Connection header.
    const headers = { 'host': 'site.test', 'connection': 'keep-alive, X-Private-Hop', 'x-private-hop': 'secret', 'x-kept': 'yes', 'te': 'trailers' }
    const req = Object.assign(new PassThrough(), { method: 'GET', url: '/jsonapi/node/page', headers, socket: { remoteAddress: '10.0.0.1' } })
    const res = new ServerResponse(req as never)
    await handler(createEvent(req as never, res))
    expect(sent).toHaveLength(1)
    expect([...sent[0]!.keys()].filter((name) => ['connection', 'x-private-hop', 'te'].includes(name))).toEqual([])
    expect(sent[0]!.get('x-kept')).toBe('yes')
  })

  // A JSON:API Drupal serves at /api: the proxy takes /api/**, and a request a Druxt route does not answer, such as a
  // method it does not take, falls through to it.
  it('answers 404, never Drupal, for a path at or under /api/_druxt when mounted at /api/**', async () => {
    proxied.splice(0, proxied.length, '/api/**')
    try {
      runtime.config = { public: { druxt: { baseUrl: 'http://drupal.test', endpoint: '/api' } }, druxt: {} }
      const fetch = vi.fn(async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/vnd.api+json' } }))
      vi.stubGlobal('fetch', fetch)
      const handle = await serve('/api/**', '../../packages/core/src/runtime/server/routes/proxy')
      for (const path of ['/api/_druxt', '/api/_druxt/', '/api/_druxt/auth/token', '/api/_druxt/cache/clear?x=1', '/api/_druxt/unknown', '/api/node/../_druxt/auth/token', '/api/%2e/_druxt/auth/logout']) {
        expect((await handle(new Request(`http://site.test${path}`))).status, path).toBe(404)
      }
      expect(fetch).not.toHaveBeenCalled()
      // Beside them, the rest of /api is Drupal's.
      expect((await handle(new Request('http://site.test/api/node/page'))).status).toBe(200)
      expect(fetch).toHaveBeenCalledTimes(1)
    } finally {
      proxied.splice(0, proxied.length, '/jsonapi/**')
    }
  })

  // An editor's save through the proxy, and a server render's reads from the content cache before and after it.
  describe('after a write', () => {
    const VIEW = '/jsonapi/views/recipes/page_1'
    const PAGE = '/jsonapi/node/page/00000000-0000-4000-8000-000000000001'
    const TAG = '/jsonapi/taxonomy_term/tags/00000000-0000-4000-8000-000000000002'

    const write = async (status: number) => {
      runtime.config = { public: { druxt: { baseUrl: 'https://drupal.test', endpoint: '/jsonapi' } }, druxt: {} }
      vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status, headers: { 'content-type': 'application/vnd.api+json' } })))
      const handler = (await import('../../packages/core/src/runtime/server/routes/proxy')).default as EventHandler
      const handle = toWebHandler(createApp().use(createRouter().patch('/jsonapi/**', handler)))
      return (await handle(new Request(`http://site.test${TAG}`, { method: 'PATCH', body: '{}', headers: { 'content-type': 'application/vnd.api+json' } }))).status
    }

    /** Reads `path` through a server client with the content cache, and counts the reads that reached Drupal. */
    const reads: string[] = []
    const read = async (path: string) => {
      const { DruxtClient } = await import('@druxt/client')
      const fetch = async (input: string | URL | Request) => {
        reads.push(new URL(String(input)).pathname)
        return new Response(JSON.stringify({ data: [], links: {} }), { status: 200, headers: { 'content-type': 'application/vnd.api+json', 'cache-control': 'public, max-age=300' } })
      }
      await new DruxtClient('https://drupal.test', { fetch, cache: { content: true } } as never).get(path)
    }

    it('reads a cached Views listing afresh after a write Drupal accepts to any resource, and keeps another type\'s entity', async () => {
      const { resetProcessCache } = await import('@druxt/client')
      resetProcessCache()
      reads.length = 0
      await read(VIEW)
      await read(PAGE)
      await read(VIEW)
      expect(reads).toEqual([VIEW, PAGE])
      expect(await write(200)).toBe(200)
      await read(VIEW)
      await read(PAGE)
      expect(reads).toEqual([VIEW, PAGE, VIEW])
    })

    it('drops nothing for a write Drupal refuses', async () => {
      const { resetProcessCache } = await import('@druxt/client')
      resetProcessCache()
      reads.length = 0
      await read(VIEW)
      expect(await write(422)).toBe(422)
      await read(VIEW)
      expect(reads).toEqual([VIEW])
    })
  })
})
