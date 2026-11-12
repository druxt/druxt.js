import { describe, expect, it } from 'vitest'
import { moduleKey } from '../../packages/core/src/runtime/utils/key'

describe('moduleKey', () => {
  it('names the module, the language, the inputs and the variant', () => {
    expect(moduleKey('DruxtRouter', 'en', 'wrapper', undefined, () => ['/recipes/x', 0])).toBe('druxt:DruxtRouter:en:["/recipes/x",0]:wrapper')
  })

  it('differs when an input differs, when the language differs, and when the variant differs', () => {
    const a = moduleKey('DruxtMenu', 'en', 'wrapper', undefined, () => ['main'])
    expect(moduleKey('DruxtMenu', 'en', 'wrapper', undefined, () => ['footer'])).not.toBe(a)
    expect(moduleKey('DruxtMenu', 'es', 'wrapper', undefined, () => ['main'])).not.toBe(a)
    expect(moduleKey('DruxtMenu', 'en', 'bare', undefined, () => ['main'])).not.toBe(a)
  })

  it('uses the contract key when given, with the language and the variant', () => {
    expect(moduleKey('DruxtRouter', 'es', 'wrapper', () => 'DruxtRouter:/es/recetas', () => ['ignored'])).toBe('druxt:DruxtRouter:/es/recetas:es:wrapper')
    expect(moduleKey('DruxtRouter', undefined, 'bare', () => 'DruxtRouter:/')).toBe('druxt:DruxtRouter:/:bare')
  })

  it('has nothing to say for a module with neither', () => {
    expect(moduleKey('DruxtDebug', 'en', 'wrapper')).toBeUndefined()
  })
})
