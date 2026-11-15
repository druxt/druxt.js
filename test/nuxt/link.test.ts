import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useNuxtApp, useRouter } from '#imports'
import { druxtLink } from '@druxt/core/runtime'
import { matchAnyPath, settle } from './helpers'

/** The paths Nuxt was asked to prefetch, through its `link:prefetch` hook, while `run` runs. */
const prefetched = async (run: () => Promise<void>): Promise<string[]> => {
  const paths: string[] = []
  const stop = useNuxtApp().hooks.hook('link:prefetch', (path: string) => { paths.push(path) })
  try {
    await run()
  } finally {
    stop()
  }
  return paths
}

describe('druxtLink()', () => {
  // A custom NuxtLink sets up no prefetch of its own: the link asks for it when the visitor points at it or focuses it.
  it('prefetches its page when pointed at or focused, as NuxtLink would, and only once', async () => {
    matchAnyPath()
    const wrapper = await mountSuspended(defineComponent({ setup: () => () => druxtLink('/en/recipes', { class: 'link' }, 'Recipes') }), { route: '/' })
    const a = wrapper.find('a.link')
    expect(a.attributes('href')).toBe('/en/recipes')
    expect(await prefetched(async () => {
      await a.trigger('pointerenter')
      await settle()
    })).toEqual(['/en/recipes'])
    expect(await prefetched(async () => {
      await a.trigger('focus')
      await settle()
    })).toEqual([])
  })

  it('prefetches on focus alone', async () => {
    matchAnyPath()
    const wrapper = await mountSuspended(defineComponent({ setup: () => () => druxtLink('/en/articles', { class: 'link' }, 'Articles') }), { route: '/' })
    expect(await prefetched(async () => {
      await wrapper.find('a.link').trigger('focus')
      await settle()
    })).toEqual(['/en/articles'])
  })

  // A caller's handlers in `attrs`, such as a wrapper's analytics, run first, then Druxt's own.
  it('runs a click handler the caller gives, then navigates', async () => {
    matchAnyPath()
    const order: string[] = []
    const onClick = vi.fn(() => { order.push('caller') })
    const wrapper = await mountSuspended(defineComponent({ setup: () => () => druxtLink('/en/recipes', { class: 'link', onClick }, 'Recipes') }), { route: '/' })
    const stop = useRouter().beforeEach((to) => { order.push(`navigate ${to.path}`) })
    try {
      await wrapper.find('a.link').trigger('click')
      await settle(() => expect(order).toEqual(['caller', 'navigate /en/recipes']))
      expect(onClick).toHaveBeenCalledWith(expect.any(MouseEvent))
    } finally {
      stop()
    }
  })

  // The router follows no click whose default was prevented, as it does for NuxtLink.
  it('does not navigate when the caller\'s click handler prevents the default', async () => {
    matchAnyPath()
    const visited: string[] = []
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault())
    const wrapper = await mountSuspended(defineComponent({ setup: () => () => druxtLink('/en/articles', { class: 'link', onClick }, 'Articles') }), { route: '/' })
    const stop = useRouter().beforeEach((to) => { visited.push(to.path) })
    try {
      await wrapper.find('a.link').trigger('click')
      await settle()
      expect(onClick).toHaveBeenCalled()
      expect(visited).toEqual([])
    } finally {
      stop()
    }
  })

  it.each(['pointerenter', 'focus'])('runs a %s handler the caller gives, then prefetches', async (event) => {
    matchAnyPath()
    const order: string[] = []
    const handler = vi.fn(() => { order.push('caller') })
    const name = event === 'focus' ? 'onFocus' : 'onPointerenter'
    const wrapper = await mountSuspended(defineComponent({ setup: () => () => druxtLink('/en/tags', { class: 'link', [name]: handler }, 'Tags') }), { route: '/' })
    const stop = useNuxtApp().hooks.hook('link:prefetch', () => { order.push('prefetch') })
    try {
      await wrapper.find('a.link').trigger(event)
      await settle(() => expect(order).toEqual(['caller', 'prefetch']))
      expect(handler).toHaveBeenCalledTimes(1)
    } finally {
      stop()
    }
  })

  it('runs every handler of a list the caller gives', async () => {
    matchAnyPath()
    const first = vi.fn()
    const second = vi.fn()
    const wrapper = await mountSuspended(defineComponent({ setup: () => () => druxtLink('/en/list', { class: 'link', onFocus: [first, second] }, 'List') }), { route: '/' })
    expect(await prefetched(async () => {
      await wrapper.find('a.link').trigger('focus')
      await settle()
    })).toEqual(['/en/list'])
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })
})
