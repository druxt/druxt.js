import { describe, expect, it } from 'vitest'
import { composeDruxtClassHooks, druxtClassNames, resolveDruxtClasses } from '../../packages/core/src/classes'
import type { DruxtClassContext } from '../../packages/core/src/classes'

const item: DruxtClassContext = { element: 'item', kind: 'reference_label', formatter: 'entity_reference_label', field: 'field_tags', multiple: true, delta: 0 }
const entity: DruxtClassContext = { element: 'entity', type: 'taxonomy_term--tags', mode: 'full' }

describe('druxtClassNames()', () => {
  it('names each element by the BEM rules the default output uses', () => {
    expect(druxtClassNames(entity)).toEqual(['druxt-entity', 'druxt-entity--full', 'druxt-entity--taxonomy-term--tags'])
    expect(druxtClassNames(item)).toEqual(['druxt-field__item', 'druxt-field__item--reference-label', 'druxt-field__item--entity-reference-label', 'druxt-field__item--field-tags', 'druxt-field__item--multiple'])
    expect(druxtClassNames({ element: 'items', field: 'field_tags' })).toEqual(['druxt-field__items', 'druxt-field__items--field-tags'])
    expect(druxtClassNames({ element: 'label', position: 'inline', field: 'field_tags' })).toEqual(['druxt-field__label', 'druxt-field__label--inline', 'druxt-field__label--field-tags'])
    expect(druxtClassNames({ element: 'label', part: 'entity', type: 'node--page', mode: 'full' })).toEqual(['druxt-entity__label'])
    expect(druxtClassNames({ element: 'field', type: 'node--recipe', field: 'field_tags', standalone: true })).toEqual(['druxt-field', 'druxt-field--standalone', 'druxt-field--node--recipe', 'druxt-field--field-tags'])
    expect(druxtClassNames({ element: 'item', part: 'link-url', field: 'field_link' })).toEqual(['druxt-field__link-url'])
    expect(druxtClassNames({ element: 'item', part: 'table', field: 'field_files' })).toEqual(['druxt-field__table'])
  })

  it('names a form\'s root, its widgets and their parts', () => {
    expect(druxtClassNames({ element: 'form', type: 'node--page', mode: 'default' })).toEqual(['druxt-entity-form'])
    expect(druxtClassNames({ element: 'form', part: 'alert' })).toEqual(['druxt-form__alert'])
    expect(druxtClassNames({ element: 'form', part: 'status', variant: 'saved' })).toEqual(['druxt-form__status', 'druxt-form__status--saved'])
    expect(druxtClassNames({ element: 'widget', kind: 'checkbox', formatter: 'boolean_checkbox', field: 'status' })).toEqual(['druxt-form__widget', 'druxt-form__widget--checkbox'])
    expect(druxtClassNames({ element: 'widget', part: 'description', field: 'title' })).toEqual(['druxt-form__description'])
    expect(druxtClassNames({ element: 'widget', part: 'error', field: 'title' })).toEqual(['druxt-form__error'])
  })

  it('names a menu\'s root, its lists, items, links and toggles', () => {
    expect(druxtClassNames({ element: 'menu', menu: 'main' })).toEqual(['druxt-menu', 'druxt-menu--main'])
    expect(druxtClassNames({ element: 'items', menu: 'main' })).toEqual(['druxt-menu__items'])
    expect(druxtClassNames({ element: 'item', menu: 'main' })).toEqual(['druxt-menu__item'])
    expect(druxtClassNames({ element: 'item', menu: 'main', active: true, activeTrail: true, expanded: true }))
      .toEqual(['druxt-menu__item', 'druxt-menu__item--active', 'druxt-menu__item--active-trail', 'druxt-menu__item--expanded'])
    expect(druxtClassNames({ element: 'link', menu: 'main', active: true })).toEqual(['druxt-menu__link', 'druxt-menu__link--active'])
    expect(druxtClassNames({ element: 'link', menu: 'main', part: 'toggle' })).toEqual(['druxt-menu__toggle'])
  })

  it('names a link or an item the menu\'s only when the context names a menu', () => {
    expect(druxtClassNames({ element: 'link' })).toEqual([])
    expect(druxtClassNames({ element: 'link', active: true })).toEqual([])
    expect(druxtClassNames({ element: 'item', active: true })).toEqual(['druxt-field__item'])
  })

  it('drops the menu name class with the name modifier, and keeps the state classes', () => {
    expect(resolveDruxtClasses({ modifiers: [] }, { element: 'menu', menu: 'main' })).toEqual(['druxt-menu'])
    expect(resolveDruxtClasses({ modifiers: ['name'] }, { element: 'menu', menu: 'main' })).toEqual(['druxt-menu', 'druxt-menu--main'])
    expect(resolveDruxtClasses({ modifiers: [] }, { element: 'item', menu: 'main', active: true, activeTrail: true, expanded: true }))
      .toEqual(['druxt-menu__item', 'druxt-menu__item--active', 'druxt-menu__item--active-trail', 'druxt-menu__item--expanded'])
  })

  it('turns a menu\'s classes off with the menu part, and leaves a field\'s items alone', () => {
    expect(resolveDruxtClasses({ menu: false }, { element: 'item', menu: 'main' })).toEqual([])
    expect(resolveDruxtClasses({ menu: false }, { element: 'link', menu: 'main' })).toEqual([])
    expect(resolveDruxtClasses({ menu: false }, { element: 'menu', menu: 'main' })).toEqual([])
    expect(resolveDruxtClasses({ menu: false }, item)).toContain('druxt-field__item')
    expect(resolveDruxtClasses({ items: false }, { element: 'item', menu: 'main' })).toEqual(['druxt-menu__item'])
  })

  it('names a breadcrumb\'s root, its list, items and links', () => {
    expect(druxtClassNames({ element: 'breadcrumb', breadcrumb: true })).toEqual(['druxt-breadcrumb'])
    expect(druxtClassNames({ element: 'items', breadcrumb: true })).toEqual(['druxt-breadcrumb__items'])
    expect(druxtClassNames({ element: 'item', breadcrumb: true, field: 'body', active: true })).toEqual(['druxt-breadcrumb__item'])
    expect(druxtClassNames({ element: 'link', breadcrumb: true })).toEqual(['druxt-breadcrumb__link'])
  })

  it('turns a breadcrumb\'s classes off with the breadcrumb part alone, and a menu\'s with the menu part alone', () => {
    for (const element of ['breadcrumb', 'items', 'item', 'link'] as const) {
      expect(resolveDruxtClasses({ breadcrumb: false }, { element, breadcrumb: true })).toEqual([])
      expect(resolveDruxtClasses({ menu: false }, { element, breadcrumb: true })).not.toEqual([])
      expect(resolveDruxtClasses({ items: false }, { element, breadcrumb: true })).not.toEqual([])
    }
    for (const element of ['menu', 'items', 'item', 'link'] as const) {
      expect(resolveDruxtClasses({ breadcrumb: false }, { element, menu: 'main' })).not.toEqual([])
    }
    expect(resolveDruxtClasses({ breadcrumb: false }, item)).toContain('druxt-field__item')
  })

  it('names a block\'s root by its plugin, and drops the plugin modifier or the whole part as the policy says', () => {
    expect(druxtClassNames({ element: 'block', plugin: 'system_menu_block' })).toEqual(['druxt-block', 'druxt-block--system-menu-block'])
    expect(druxtClassNames({ element: 'block' })).toEqual(['druxt-block'])
    expect(resolveDruxtClasses({ modifiers: [] }, { element: 'block', plugin: 'system_menu_block' })).toEqual(['druxt-block'])
    expect(resolveDruxtClasses({ modifiers: ['plugin'] }, { element: 'block', plugin: 'system_menu_block' })).toEqual(['druxt-block', 'druxt-block--system-menu-block'])
    expect(resolveDruxtClasses({ block: false }, { element: 'block', plugin: 'system_menu_block' })).toEqual([])
    expect(resolveDruxtClasses({ block: false }, { element: 'menu', menu: 'main' })).toEqual(['druxt-menu', 'druxt-menu--main'])
  })

  it('lists a class once, as for a formatter named as its kind', () => {
    expect(druxtClassNames({ element: 'item', kind: 'image', formatter: 'image', field: 'field_image' })).toEqual(['druxt-field__item', 'druxt-field__item--image', 'druxt-field__item--field-image'])
  })
})

describe('resolveDruxtClasses()', () => {
  it('outputs every class for true, an unset policy or an unknown value', () => {
    for (const policy of [true, undefined, 'yes' as never]) expect(resolveDruxtClasses(policy, item)).toEqual(druxtClassNames(item))
  })

  it('outputs no class for false', () => {
    for (const ctx of [item, entity, { element: 'label', position: 'above', field: 'body' } as DruxtClassContext]) expect(resolveDruxtClasses(false, ctx)).toEqual([])
  })

  it('drops a part the policy turns off, and keeps the others', () => {
    expect(resolveDruxtClasses({ items: false }, item)).toEqual([])
    expect(resolveDruxtClasses({ items: false }, { element: 'items', field: 'field_tags' })).toEqual([])
    expect(resolveDruxtClasses({ items: false }, entity)).toEqual(druxtClassNames(entity))
    expect(resolveDruxtClasses({ entity: false }, entity)).toEqual([])
    expect(resolveDruxtClasses({ label: false }, { element: 'label', part: 'entity' })).toEqual([])
    expect(resolveDruxtClasses({ field: false }, { element: 'field', type: 'node--recipe', field: 'body', standalone: true })).toEqual([])
    for (const ctx of [{ element: 'form' }, { element: 'form', part: 'status' }, { element: 'widget', kind: 'json' }, { element: 'widget', part: 'error' }] as DruxtClassContext[]) {
      expect(resolveDruxtClasses({ form: false }, ctx)).toEqual([])
      expect(resolveDruxtClasses({ items: false }, ctx)).toEqual(druxtClassNames(ctx))
    }
    expect(resolveDruxtClasses({ modifiers: ['field'] }, { element: 'widget', kind: 'json' })).toEqual(['druxt-form__widget'])
  })

  it('keeps only the modifiers listed, and every base class', () => {
    expect(resolveDruxtClasses({ modifiers: ['field'] }, item)).toEqual(['druxt-field__item', 'druxt-field__item--field-tags'])
    expect(resolveDruxtClasses({ modifiers: [] }, item)).toEqual(['druxt-field__item'])
    expect(resolveDruxtClasses({ modifiers: ['mode'] }, entity)).toEqual(['druxt-entity', 'druxt-entity--full'])
    // A label's position stays: it is not a modifier a site drops.
    expect(resolveDruxtClasses({ modifiers: [] }, { element: 'label', position: 'hidden', field: 'body' })).toEqual(['druxt-field__label', 'druxt-field__label--hidden'])
  })

  it('builds the type modifier from the entity type and the bundle, each kept on its own', () => {
    expect(resolveDruxtClasses({ modifiers: ['type', 'bundle'] }, entity)).toEqual(['druxt-entity', 'druxt-entity--taxonomy-term--tags'])
    expect(resolveDruxtClasses({ modifiers: ['type'] }, entity)).toEqual(['druxt-entity', 'druxt-entity--taxonomy-term'])
    expect(resolveDruxtClasses({ modifiers: ['bundle'] }, entity)).toEqual(['druxt-entity', 'druxt-entity--tags'])
  })

  it('runs the hook after the policy, with a copy of the context, whatever the policy', () => {
    const seen: DruxtClassContext[] = []
    const hook = (classes: string[], ctx: DruxtClassContext) => {
      seen.push(ctx)
      return [...classes.map((name) => name.replace('druxt-', 'x-')), 'site', '']
    }
    expect(resolveDruxtClasses({ modifiers: [] }, item, hook)).toEqual(['x-field__item', 'site'])
    expect(resolveDruxtClasses(false, item, hook)).toEqual(['site'])
    expect(seen[0]).toEqual(item)
    expect(seen[0]).not.toBe(item)
  })

  it('composes hooks in the order given', () => {
    const hook = composeDruxtClassHooks([(classes) => [...classes, 'a'], (classes) => [...classes, 'b']])!
    expect(resolveDruxtClasses(false, item, hook)).toEqual(['a', 'b'])
    expect(composeDruxtClassHooks([])).toBeUndefined()
  })
})
