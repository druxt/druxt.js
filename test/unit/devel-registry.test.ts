import { afterEach, describe, expect, it } from 'vitest'
import { missingWrappers, registerMissing, unregisterMissing } from '../../packages/core/src/runtime/devel/registry'

const entry = (uid: number, component = 'DruxtField', options = ['DruxtFieldTitle', 'DruxtFieldDefault']) =>
  ({ uid, component, options, props: ['value'], slots: [], template: {} })

describe('the missing-wrapper registry', () => {
  afterEach(() => { [1, 2, 3].forEach(unregisterMissing) })

  it('keeps one entry for modules with the same component and candidates, with a count', () => {
    registerMissing(entry(1))
    registerMissing(entry(2))
    expect([...missingWrappers.keys()]).toEqual(['DruxtField:DruxtFieldTitle,DruxtFieldDefault'])
    expect([...missingWrappers.values()][0]).toMatchObject({ component: 'DruxtField', count: 2 })
    unregisterMissing(1)
    expect([...missingWrappers.values()][0]!.count).toBe(1)
    unregisterMissing(2)
    expect(missingWrappers.size).toBe(0)
  })

  it('keeps an entry of count 1 for a single module', () => {
    registerMissing(entry(1))
    expect([...missingWrappers.values()]).toEqual([{ component: 'DruxtField', options: ['DruxtFieldTitle', 'DruxtFieldDefault'], props: ['value'], slots: [], template: {}, count: 1 }])
  })

  it('lists different candidates as different entries', () => {
    registerMissing(entry(1))
    registerMissing(entry(2, 'DruxtField', ['DruxtFieldBody']))
    expect(missingWrappers.size).toBe(2)
  })

  it('counts a module once when it registers again', () => {
    registerMissing(entry(1))
    registerMissing(entry(1))
    expect([...missingWrappers.values()][0]!.count).toBe(1)
  })
})
