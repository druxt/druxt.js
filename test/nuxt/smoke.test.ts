import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useNuxtApp } from '#imports'

describe('the component test environment', () => {
  it('runs in development, with the Druxt client provided', async () => {
    const wrapper = await mountSuspended(defineComponent({
      setup: () => () => h('p', String(!!useNuxtApp().$druxt) + ':' + String(import.meta.dev)),
    }))
    expect(wrapper.text()).toBe('true:true')
  })
})
