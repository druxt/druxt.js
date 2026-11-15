import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { druxtModuleEmits, druxtModuleProps } from '../../packages/core/src/runtime/props'

describe('druxtModuleEmits', () => {
  // yarn typecheck compiles this: a module written as the README shows it gives the list to `emits` as it is.
  it('is a component\'s emits as it is', () => {
    const module = defineComponent({ name: 'DruxtTest', props: druxtModuleProps, emits: druxtModuleEmits, setup: () => () => null })
    expect(module.emits).toEqual(['update:modelValue'])
  })
})
