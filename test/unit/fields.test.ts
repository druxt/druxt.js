import { describe, expect, it } from 'vitest'
import { resolveEntityFields } from '../../packages/core/src/fields'

describe('resolveEntityFields()', () => {
  it('asks for the display\'s fields and each wrapper\'s in auto, once each', () => {
    expect(resolveEntityFields(['body', 'field_tags'], [['field_subtitle', 'body'], ['field_hidden']], 'auto')).toEqual(['body', 'field_tags', 'field_subtitle', 'field_hidden'])
    expect(resolveEntityFields(['body'], [], 'auto')).toEqual(['body'])
  })

  it('asks for every field in auto when a wrapper reads fields its source does not name', () => {
    expect(resolveEntityFields(['body'], [['field_subtitle'], '*'], 'auto')).toBeUndefined()
  })

  it('asks for the display\'s fields alone with true, and every field with false', () => {
    expect(resolveEntityFields(['body', 'body'], ['*'], true)).toEqual(['body'])
    expect(resolveEntityFields(['body'], [['field_subtitle']], false)).toBeUndefined()
  })
})
