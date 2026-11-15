import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPageGuard, pageOf } from '../../packages/core/src/runtime/devel/utils/requests'

describe('telling a new page from a place in the page shown', () => {
  // Under app.baseURL the browser's path carries the base, and the router's does not: the guard starts from the router.
  it('starts from the router\'s route, without the app\'s base URL', async () => {
    const router = createRouter({ history: createMemoryHistory('/base/'), routes: [{ path: '/:path(.*)*', component: { render: () => null } }] })
    await router.push('/articles/oatmeal?page=2')
    expect(router.options.history.base).toBe('/base')
    const isNewPage = createPageGuard(router.currentRoute.value.fullPath)
    expect(isNewPage('/articles/oatmeal?page=2#comments')).toBeUndefined()
    expect(isNewPage('/articles/oatmeal?page=2')).toBeUndefined()
    // The browser's path for the same page is another page to the router: the guard must not start from it.
    expect(createPageGuard('/base/articles/oatmeal?page=2')('/articles/oatmeal?page=2')).toBe('/articles/oatmeal?page=2')
  })

  it('returns each new page once, a hash in it included', () => {
    const isNewPage = createPageGuard('/')
    expect(isNewPage('/news')).toBe('/news')
    expect(isNewPage('/news#top')).toBeUndefined()
    expect(isNewPage('/news?page=2')).toBe('/news?page=2')
    expect(isNewPage('/')).toBe('/')
  })

  // The server labels its requests with the page it rendered, and the browser's guard names each page it shows, the
  // same way, so the browser shows them on that page alone.
  it('names a page as the server labels its requests, without a hash', () => {
    expect(pageOf('/articles/oatmeal?page=2#comments')).toBe('/articles/oatmeal?page=2')
    expect(pageOf('/')).toBe('/')
    expect(createPageGuard('/')('/articles/oatmeal?page=2#comments')).toBe(pageOf('/articles/oatmeal?page=2#comments'))
  })
})
