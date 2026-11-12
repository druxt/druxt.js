// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { DELTA, ENTITY, entityAnchors, escapeValue, FIELD, fieldAnchors, findAnchor, LANGCODE, resolveDruxtAnchors, TYPE } from '../../packages/core/src/anchors'
import { anchorsSettings } from '../../packages/core/src/runtime/devel/utils/devtools'

describe('@druxt/core/anchors', () => {
  // The attribute names are the contract an editor, a diff view or a canvas in another repository reads. Change one and
  // this fails, rather than a query missing at runtime.
  it('keeps the four attribute names frozen, and the language beside them', () => {
    expect(ENTITY).toBe('data-druxt-entity')
    expect(TYPE).toBe('data-druxt-type')
    expect(FIELD).toBe('data-druxt-field')
    expect(DELTA).toBe('data-druxt-delta')
    expect(LANGCODE).toBe('data-druxt-langcode')
  })

  it('names an entity only with an id, with its type and language when given', () => {
    expect(entityAnchors('node--recipe', '')).toEqual({})
    expect(entityAnchors('node--recipe', undefined)).toEqual({})
    expect(entityAnchors('node--recipe', 'abc')).toEqual({ 'data-druxt-entity': 'abc', 'data-druxt-type': 'node--recipe' })
    expect(entityAnchors(null, 'abc')).toEqual({ 'data-druxt-entity': 'abc' })
    expect(entityAnchors('node--recipe', 'abc', 'es')).toEqual({ 'data-druxt-entity': 'abc', 'data-druxt-type': 'node--recipe', 'data-druxt-langcode': 'es' })
  })

  it('names a field, and an item\'s delta only when it is a number, zero included, as a string', () => {
    expect(fieldAnchors('field_tags')).toEqual({ 'data-druxt-field': 'field_tags' })
    expect(fieldAnchors('field_tags', 0)).toEqual({ 'data-druxt-field': 'field_tags', 'data-druxt-delta': '0' })
    expect(fieldAnchors('')).toEqual({})
  })

  it('builds one selector from a description, escaping each value, and finds nothing for an empty one', () => {
    const calls: string[] = []
    const root = { querySelector: (selector: string) => { calls.push(selector); return { selector } } }
    expect(findAnchor(root, {})).toBeNull()
    expect(findAnchor(root, { entity: 'a"b', type: 'node--recipe', langcode: 'en', field: 'field_tags', delta: 0 })).toEqual({ selector: calls[0] })
    expect(calls).toEqual(['[data-druxt-entity="a\\"b"][data-druxt-type="node--recipe"][data-druxt-langcode="en"][data-druxt-field="field_tags"][data-druxt-delta="0"]'])
    expect(escapeValue('a\\b')).toBe('a\\\\b')
  })

  // A tool that runs before the page mounts, or during a server render, has nothing to search.
  it('gives null, never throws, for a root that cannot be searched', () => {
    expect(findAnchor(null, { entity: 'abc' })).toBeNull()
    expect(findAnchor(undefined, { entity: 'abc' })).toBeNull()
    expect(findAnchor({} as never, { entity: 'abc' })).toBeNull()
    expect(findAnchor({ querySelector: () => null }, { entity: 'abc' })).toBeNull()
  })

  it('finds an element in a document', () => {
    document.body.innerHTML = '<ul><li data-druxt-field="field_tags" data-druxt-delta="0">a</li><li data-druxt-field="field_tags" data-druxt-delta="1">b</li></ul>'
    expect(findAnchor(document, { field: 'field_tags', delta: 1 })?.textContent).toBe('b')
    document.body.innerHTML = ''
  })
})

describe('resolveDruxtAnchors()', () => {
  it('is on in development and off in production by default, and on in production when a module requires them', () => {
    expect(resolveDruxtAnchors({ dev: true })).toEqual({ enabled: true, requiredBy: [] })
    expect(resolveDruxtAnchors({ dev: false })).toEqual({ enabled: false, requiredBy: [] })
    expect(resolveDruxtAnchors({ setting: 'dev', dev: false, requiredBy: ['@druxt/site'] })).toEqual({ enabled: true, requiredBy: ['@druxt/site'] })
  })

  it('lets the site\'s explicit setting win, naming the site when its false overrules a module', () => {
    expect(resolveDruxtAnchors({ setting: true, dev: false })).toEqual({ enabled: true, requiredBy: [] })
    expect(resolveDruxtAnchors({ setting: false, dev: true })).toEqual({ enabled: false, requiredBy: [] })
    expect(resolveDruxtAnchors({ setting: false, dev: false, requiredBy: ['a', 'b', 'a'] })).toEqual({ enabled: false, requiredBy: ['a', 'b'], disabledBy: 'site' })
  })

  it('reads an unknown setting as unset', () => {
    expect(resolveDruxtAnchors({ setting: 'yes', dev: false })).toEqual({ enabled: false, requiredBy: [] })
  })
})

describe('anchorsSettings()', () => {
  it('lists the state for the Settings section, with the site\'s false when it overruled a module', () => {
    expect(anchorsSettings({ enabled: true, requiredBy: ['@druxt/site'] }, false)).toEqual([
      { key: 'anchors', value: true, tier: 'default' },
      { key: 'anchors.requiredBy', value: ['@druxt/site'], tier: 'default' },
    ])
    expect(anchorsSettings({ enabled: false, requiredBy: ['@druxt/site'], disabledBy: 'site' }, true)).toEqual([
      { key: 'anchors', value: false, tier: 'site' },
      { key: 'anchors.requiredBy', value: ['@druxt/site'], tier: 'default' },
      { key: 'anchors.disabledBy', value: 'site', tier: 'site' },
    ])
  })
})
