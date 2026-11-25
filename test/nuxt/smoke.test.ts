import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useNuxtApp } from '#imports'

describe('the component test environment', () => {
  // The Druxt client joins this assertion with @druxt/core.
  it('runs in development, with the Nuxt app provided', async () => {
    const wrapper = await mountSuspended(defineComponent({
      setup: () => () => h('p', String(!!useNuxtApp()) + ':' + String(import.meta.dev)),
    }))
    expect(wrapper.text()).toBe('true:true')
  })
})
