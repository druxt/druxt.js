import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, provide, ref } from 'vue'
import type { Component } from 'vue'
import { useRouter, useState } from '#imports'
import { PageRouteSymbol } from '#app/components/injections'
import { DRUXT_PAGE_TITLE_STATE, useDruxtPageTitle } from '@druxt/core/runtime'
import type { DruxtPageTitle } from '@druxt/core/runtime'
// NuxtPage itself: the test app has no pages directory, so Nuxt registers no NuxtPage component.
import NuxtPage from '../../node_modules/nuxt/dist/pages/runtime/page.js'
import { matchAnyPath, settle } from './helpers'

enableAutoUnmount(afterEach)

/** A component that renders an h1 only while it owns the page's title, as the page title block does. */
const claimant = (owner: string) => defineComponent({
  name: `Claimant${owner}`,
  setup: () => {
    const title = useDruxtPageTitle()
    return () => (title.claim(owner) ? h('h1', owner) : null)
  },
})
const A = claimant('a')
const B = claimant('b')

/** The h1 texts a wrapper renders, in order. */
const headings = (wrapper: { findAll: (selector: string) => Array<{ text: () => string }> }) => wrapper.findAll('h1').map((node) => node.text())

/** Mounts a component that keeps the composable, for a test to claim through. */
const holder = async (route = '/') => {
  let title: DruxtPageTitle | undefined
  await mountSuspended(defineComponent({ setup: () => { title = useDruxtPageTitle(); return () => null } }), { route })
  return title!
}

beforeEach(() => {
  matchAnyPath()
  useState(DRUXT_PAGE_TITLE_STATE).value = {}
})

describe('useDruxtPageTitle()', () => {
  it('gives the title to the first claim, and keeps it for that owner', async () => {
    const title = await holder()
    expect(title.owner.value).toBeUndefined()
    expect(title.claim('a')).toBe(true)
    expect(title.claim('b')).toBe(false)
    expect(title.claim('a')).toBe(true)
    expect(title.owner.value).toBe('a')
  })

  it('renders one h1 when two components claim the title, the first\'s, in either order', async () => {
    const ab = await mountSuspended(defineComponent({ setup: () => () => [h(A), h(B)] }))
    await settle()
    expect(headings(ab)).toEqual(['a'])
    ab.unmount()

    const ba = await mountSuspended(defineComponent({ setup: () => () => [h(B), h(A)] }))
    await settle()
    expect(headings(ba)).toEqual(['b'])
  })

  it('starts again for the page a client navigation reaches', async () => {
    const title = await holder('/one')
    expect(title.claim('a')).toBe(true)
    await useRouter().push('/two')
    expect(title.owner.value).toBeUndefined()
    expect(title.claim('b')).toBe(true)
    expect(title.owner.value).toBe('b')
    // A query on the same page is the same page.
    await useRouter().push('/two?page=2')
    expect(title.claim('a')).toBe(false)
  })

  it('lets the title go when its owner unmounts, so the next claimant renders the h1', async () => {
    const showA = ref(true)
    const wrapper = await mountSuspended(defineComponent({ setup: () => () => [showA.value ? h(A) : null, h(B)] }))
    await settle()
    expect(headings(wrapper)).toEqual(['a'])
    showA.value = false
    await settle(() => expect(headings(wrapper)).toEqual(['b']))
  })

  it('throws a TypeError naming an empty owner', async () => {
    const title = await holder()
    expect(() => title.claim('')).toThrow(TypeError)
    expect(() => title.claim('')).toThrow(/owner/)
  })

  it('never lets a page the router has left take the new page\'s title', async () => {
    // Each page provides its own route, as NuxtPage does: the outgoing page's stays on its path while it leaves.
    const page = (path: string, child: Component) => defineComponent({ setup: () => { provide(PageRouteSymbol, { path } as never); return () => h(child) } })
    const tick = ref(0)
    const Leaving = defineComponent({ setup: () => { const title = useDruxtPageTitle(); return () => (tick.value >= 0 && title.claim('a') ? h('h1', 'a') : null) } })
    const showNew = ref(false)
    const OldPage = page('/one', Leaving)
    const NewPage = page('/two', B)
    const wrapper = await mountSuspended(defineComponent({ setup: () => () => [h(OldPage), showNew.value ? h(NewPage) : null] }), { route: '/one' })
    await settle()
    expect(headings(wrapper)).toEqual(['a'])
    await useRouter().push('/two')
    // The old page renders again before the new one, still mounted, as it does during a transition.
    tick.value++
    await settle()
    showNew.value = true
    await settle(() => expect(headings(wrapper)).toEqual(['b']))
  })

  it('gives each page its h1 under <NuxtPage keepalive>, going and coming back', async () => {
    const router = useRouter()
    for (const name of ['one', 'two']) {
      if (!router.hasRoute(`druxt-title-${name}`)) router.addRoute({ name: `druxt-title-${name}`, path: `/title/${name}`, component: claimant(name) })
    }
    const wrapper = await mountSuspended(defineComponent({ setup: () => () => h(NuxtPage, { keepalive: true }) }), { route: '/title/one' })
    await settle(() => expect(headings(wrapper)).toEqual(['one']))
    await router.push('/title/two')
    await settle(() => expect(headings(wrapper)).toEqual(['two']))
    await router.push('/title/one')
    await settle(() => expect(headings(wrapper)).toEqual(['one']))
  })

  it('lets the title go when its owner is deactivated, so a claimant on the same page takes the h1', async () => {
    const showA = ref(true)
    const wrapper = await mountSuspended(defineComponent({ setup: () => () => h(KeepAlive, null, [showA.value ? h(A) : h(B)]) }))
    await settle()
    expect(headings(wrapper)).toEqual(['a'])
    showA.value = false
    await settle(() => expect(headings(wrapper)).toEqual(['b']))
    // Back again: B, now deactivated, lets it go, and A takes it back.
    showA.value = true
    await settle(() => expect(headings(wrapper)).toEqual(['a']))
  })

  it('warns in development when called with no scope to let its claim go', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      useDruxtPageTitle()
      expect(warn.mock.calls.map((call) => String(call[0])).some((message) => message.includes('useDruxtPageTitle()') && message.includes('scope'))).toBe(true)
    } finally {
      warn.mockRestore()
    }
  })
})
