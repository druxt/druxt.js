import { defineAsyncComponent, defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { declaresEmit, declaresRootless, pickProps, readWrapper } from '../../packages/core/src/runtime/utils/wrapper'
import { serializable } from '../../packages/core/src/runtime/utils/serializable'

const Wrapper = defineComponent({
  props: { entity: Object, schema: Object },
  emits: ['update:modelValue'],
  druxt: { query: { fields: ['title'] } },
})

describe('reading a wrapper', () => {
  it('reads its props and druxt settings', async () => {
    const { props, druxt } = await readWrapper(Wrapper)
    expect(Object.keys(props)).toEqual(['entity', 'schema'])
    expect(druxt).toEqual({ query: { fields: ['title'] } })
  })

  // Nuxt registers global components as async wrappers. Reading through one
  // relies on Vue's internal __asyncLoader; this fails if a Vue upgrade changes it.
  it('loads an async component first', async () => {
    const { props } = await readWrapper(defineAsyncComponent(() => Promise.resolve({ default: Wrapper })))
    expect(Object.keys(props)).toEqual(['entity', 'schema'])
  })

  it('collects props through extends and mixins, array form included', async () => {
    const Base = defineComponent({ props: ['langcode'], druxt: { a: 1 } })
    const Mixin = defineComponent({ props: { fields: Object } })
    const { props, druxt } = await readWrapper(defineComponent({ extends: Base, mixins: [Mixin], props: { entity: Object }, druxt: { b: 2 } }))
    expect(Object.keys(props).sort()).toEqual(['entity', 'fields', 'langcode'])
    expect(druxt).toEqual({ a: 1, b: 2 })
  })

  it('reads nothing from a component that is not registered', async () => {
    expect(await readWrapper(undefined)).toEqual({ druxt: {}, props: {} })
  })

  it('finds an event declared directly or through a mixin', () => {
    expect(declaresEmit(Wrapper, 'update:modelValue')).toBe(true)
    expect(declaresEmit(defineComponent({ mixins: [Wrapper] }), 'update:modelValue')).toBe(true)
    expect(declaresEmit(defineComponent({ emits: { change: null } }), 'update:modelValue')).toBe(false)
  })
})

describe('a rootless wrapper', () => {
  it('declares it through its own option, extends or mixins, and no other way', () => {
    const rootless = { druxtRootless: true }
    expect(declaresRootless(defineComponent({ druxtRootless: true }))).toBe(true)
    expect(declaresRootless({ extends: rootless })).toBe(true)
    expect(declaresRootless({ mixins: [{}, { extends: rootless }] })).toBe(true)
    expect(declaresRootless(defineComponent({}))).toBe(false)
    expect(declaresRootless({ druxtRootless: 'yes' })).toBe(false)
    expect(declaresRootless(undefined)).toBe(false)
  })
})

describe('picking props', () => {
  it('delivers only what the wrapper declares', () => {
    expect(pickProps({ entity: 1, extra: 2, langcode: 'en' }, ['entity', 'langcode', 'missing'])).toEqual({ entity: 1, langcode: 'en' })
  })
})

describe('payload copies', () => {
  it('drop functions, at any depth', () => {
    expect(serializable({ a: 1, f: () => 1, nested: { b: [1, () => 2], g: () => 3 } })).toEqual({ a: 1, nested: { b: [1] } })
  })
})
