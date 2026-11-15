// @druxt/core/classes: the names of Druxt's classes, and the policy that keeps, drops or rewrites them. Framework
// free: nothing here imports Vue, Nuxt or h3, so a later adapter for another framework reuses it as it is.

/** A modifier a site can drop from Druxt's classes while keeping each base class. */
export type DruxtClassModifier = 'kind' | 'formatter' | 'field' | 'multiple' | 'mode' | 'type' | 'bundle' | 'name' | 'plugin'

/** Every modifier, in the order the classes list them. */
export const DRUXT_CLASS_MODIFIERS: readonly DruxtClassModifier[] = ['mode', 'type', 'bundle', 'kind', 'formatter', 'field', 'multiple', 'name', 'plugin']

/**
 * Which of Druxt's classes to output, part by part. A part left out is kept.
 *
 * @example @lang js
 * // The base classes and the field modifier only.
 * { modifiers: ['field'] }
 */
export interface DruxtClassPolicyParts {
  /** A DruxtEntity's root: `druxt-entity` and its modifiers. */
  entity?: boolean
  /** A standalone DruxtField's root: `druxt-field`, `druxt-field--standalone` and its modifiers. */
  field?: boolean
  /** Labels: a field's `druxt-field__label` and an entity's `druxt-entity__label`, with their modifiers. */
  label?: boolean
  /** A field's items and the elements inside them: `druxt-field__item`, `druxt-field__items` and their modifiers. */
  items?: boolean
  /** A DruxtEntityForm's elements: `druxt-entity-form`, each `druxt-form__widget` and the parts inside the form. */
  form?: boolean
  /** A DruxtMenu's elements: `druxt-menu`, and each `druxt-menu__items`, `druxt-menu__item`, `druxt-menu__link` and `druxt-menu__toggle`. */
  menu?: boolean
  /** A DruxtBreadcrumb's elements: `druxt-breadcrumb`, and its `druxt-breadcrumb__items`, `druxt-breadcrumb__item` and `druxt-breadcrumb__link`. */
  breadcrumb?: boolean
  /** A DruxtBlock's root, `druxt-block` and its plugin modifier, and the bundled block wrappers' parts. */
  block?: boolean
  /** The modifiers to keep, every one when not set. A label's position, a standalone root's own class and a menu's state classes always stay. */
  modifiers?: DruxtClassModifier[]
}

/**
 * `druxt.classes`: `true` for every class (the default), `false` for none, or the parts to keep.
 *
 * @example @lang js
 * export default defineNuxtConfig({
 *   druxt: { classes: { items: false, modifiers: ['field', 'mode'] } },
 * })
 */
export type DruxtClassPolicy = boolean | DruxtClassPolicyParts

/** The element a class list is for. */
export type DruxtClassElement = 'entity' | 'field' | 'item' | 'items' | 'label' | 'form' | 'widget' | 'menu' | 'link' | 'breadcrumb' | 'block' | 'branding' | 'language-switcher'

/**
 * What a class list is for: the element, and what Druxt knows about it. An override hook receives it.
 *
 * @example @lang js
 * { element: 'item', type: 'node--recipe', bundle: 'recipe', mode: 'full', field: 'field_tags', kind: 'reference_label', formatter: 'entity_reference_label', delta: 0, multiple: true, standalone: false }
 */
export interface DruxtClassContext {
  /** The element. */
  element: DruxtClassElement
  /** The entity's JSON:API resource type, such as `node--recipe`. */
  type?: string
  /** The entity's bundle, such as `recipe`. Read from `type` when not set. */
  bundle?: string
  /** The display mode, such as `full`. */
  mode?: string
  /** The field id, such as `field_tags`. */
  field?: string
  /** The kind of output an item has, such as `text` or `reference_label`, or a form widget's, such as `checkbox`. */
  kind?: string
  /** The formatter or widget, such as `text_default`. */
  formatter?: string
  /** The item's index in its field. */
  delta?: number
  /** Whether the field's cardinality allows several values. */
  multiple?: boolean
  /** Whether the field renders outside its entity. */
  standalone?: boolean
  /** A label's position: `above`, `inline` or `hidden`. */
  position?: string
  /** A menu's machine name, such as `main`. Set, an `item`, `items` or `link` is a menu's. Unset, a `link` has no class. */
  menu?: string
  /** Whether the element is a breadcrumb's. Set, an `item`, `items` or `link` is the breadcrumb's. */
  breadcrumb?: boolean
  /** A block's plugin, without its derivative, such as `system_menu_block`. */
  plugin?: string
  /** Whether a menu link is the current page's. */
  active?: boolean
  /** Whether a menu link is the current page's or above it. */
  activeTrail?: boolean
  /** Whether a menu item shows its children. */
  expanded?: boolean
  /**
   * A part inside the element. For a label, `entity` is the entity's title. For an item, `table` is a file table, `file`
   * its link, and `link-title` and `link-url` a separate link's parts. For a form, `alert` is the form error and
   * `status` the save status. For a widget, `description` is the field's description and `error` its errors. For a
   * menu's link, `toggle` is the button that opens and closes its children. For a block, `page-title` is the page title
   * block's heading and `label` a placement's shown label. For branding, `name`, `logo` and `slogan` are its parts. For
   * the language switcher, `language-item` and `language-link`.
   */
  part?: 'entity' | 'table' | 'file' | 'link-title' | 'link-url' | 'alert' | 'status' | 'description' | 'error' | 'toggle' | 'page-title' | 'label' | 'name' | 'logo' | 'slogan' | 'language-item' | 'language-link'
  /** The part's variant, such as `saved` for a form's status. */
  variant?: string
}

/**
 * Rewrites a class list. It runs on the server and in the browser alike, so it must return the same list for the same
 * input: no random values, no dates, no browser-only state.
 *
 * @param classes - Druxt's classes for the element, after the policy.
 * @param ctx - What the list is for.
 * @returns The classes to output.
 */
export type DruxtClassHook = (classes: string[], ctx: DruxtClassContext) => string[]

/** A name in a class: lower case, with each run of other characters as one hyphen. */
const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** One class, and the modifier that names it, if any. */
type Named = [name: string, modifier?: DruxtClassModifier]

/** The type modifier's two halves: the entity type, kept by `type`, and the bundle, kept by `bundle`. */
const typeClass = (block: string, ctx: DruxtClassContext, modifiers: (modifier: DruxtClassModifier) => boolean): Named[] => {
  if (!ctx.type) return []
  const [entityType, ...rest] = ctx.type.split('--')
  const bundle = ctx.bundle !== undefined ? slug(ctx.bundle) : rest.map(slug).join('--')
  const parts = [modifiers('type') ? slug(entityType!) : '', modifiers('bundle') ? bundle : ''].filter(Boolean)
  return parts.length ? [[`${block}--${parts.join('--')}`]] : []
}

/**
 * Druxt's classes for an element, by its naming rules, before any policy: a base class, and a modifier for each fact
 * the element has.
 *
 * - `entity`: `druxt-entity`, `druxt-entity--<mode>` and `druxt-entity--<type>`, such as `druxt-entity--node--recipe`.
 * - `field`: a standalone field's root, `druxt-field`, `druxt-field--standalone`, `druxt-field--<type>` and `druxt-field--<field>`.
 * - `label`: `druxt-field__label`, `druxt-field__label--<position>` and `druxt-field__label--<field>`, or `druxt-entity__label` for an entity's.
 * - `item`: `druxt-field__item`, with `--<kind>`, `--<formatter>`, `--<field>` and `--multiple`.
 * - `items`: `druxt-field__items` and `druxt-field__items--<field>`.
 * - `form`: a DruxtEntityForm's root, `druxt-entity-form`, or a part of it, such as `druxt-form__alert` or
 *   `druxt-form__status--saved`.
 * - `widget`: a form field's widget, `druxt-form__widget` and `druxt-form__widget--<kind>`, such as
 *   `druxt-form__widget--checkbox`, or a part of it, `druxt-form__description` or `druxt-form__error`.
 * - `menu`: a DruxtMenu's root, `druxt-menu` and `druxt-menu--<menu>`, such as `druxt-menu--main`, whose modifier key
 *   is `name`.
 * - `items` and `item` with `menu` set: a menu's list, `druxt-menu__items`, and its item, `druxt-menu__item` with
 *   `--active`, `--active-trail` and `--expanded`.
 * - `link` with `menu` set: a menu item's link, `druxt-menu__link` and `druxt-menu__link--active`, or its `toggle`
 *   part, `druxt-menu__toggle`. Without `menu` or `breadcrumb`, a `link` has no class.
 * - `breadcrumb`: a DruxtBreadcrumb's root, `druxt-breadcrumb`.
 * - `items`, `item` and `link` with `breadcrumb` set: the breadcrumb's list, `druxt-breadcrumb__items`, its item,
 *   `druxt-breadcrumb__item`, and a crumb's link, `druxt-breadcrumb__link`.
 * - `block`: a DruxtBlock's root, `druxt-block` and `druxt-block--<plugin>`, such as `druxt-block--system-menu-block`,
 *   or a part of a bundled wrapper's output, such as the page title's `druxt-block__page-title` or a shown label's
 *   `druxt-block__label`.
 * - `branding`: the branding block's `druxt-branding__name`, `druxt-branding__logo` and `druxt-branding__slogan`.
 * - `language-switcher`: the language switcher's list, `druxt-language-switcher`, its `language-item` part,
 *   `druxt-language-switcher__item`, and its `language-link` part, `druxt-language-switcher__link`, with a variant such
 *   as `--untranslated`.
 *
 * A menu's state classes, `--active`, `--active-trail` and `--expanded`, have no modifier key: they always stay, as a
 * label's position does.
 *
 * Each modifier is lower case, with each run of other characters as one hyphen. A class is listed once.
 *
 * @param ctx - What the list is for.
 * @param keep - Whether a modifier is kept. Every one when not given.
 * @returns The classes.
 *
 * @example @lang js
 * druxtClassNames({ element: 'item', kind: 'image', formatter: 'image', field: 'field_image' })
 * // ['druxt-field__item', 'druxt-field__item--image', 'druxt-field__item--field-image']
 */
export function druxtClassNames(ctx: DruxtClassContext, keep: (modifier: DruxtClassModifier) => boolean = () => true): string[] {
  const named: Named[] = []
  const add = (value: string | undefined, block: string, modifier: DruxtClassModifier) => {
    if (value) named.push([`${block}--${slug(value)}`, modifier])
  }
  if ((ctx.element === 'item' || ctx.element === 'items' || ctx.element === 'link') && ctx.breadcrumb && ctx.menu === undefined) {
    return [`druxt-breadcrumb__${ctx.element}`]
  }
  if ((ctx.element === 'item' || ctx.element === 'items') && ctx.menu !== undefined) {
    named.push([ctx.element === 'item' ? 'druxt-menu__item' : 'druxt-menu__items'])
    if (ctx.element === 'item') {
      if (ctx.active) named.push(['druxt-menu__item--active'])
      if (ctx.activeTrail) named.push(['druxt-menu__item--active-trail'])
      if (ctx.expanded) named.push(['druxt-menu__item--expanded'])
    }
    return [...new Set(named.map(([name]) => name))]
  }
  switch (ctx.element) {
    case 'breadcrumb':
      named.push(['druxt-breadcrumb'])
      break
    case 'block':
      // A part of a bundled block wrapper's output, such as the page title's `druxt-block__page-title`.
      if (ctx.part) {
        named.push([`druxt-block__${ctx.part}`])
        break
      }
      named.push(['druxt-block'])
      add(ctx.plugin, 'druxt-block', 'plugin')
      break
    case 'branding':
      // The branding block's parts: `druxt-branding__name`, `druxt-branding__logo` and `druxt-branding__slogan`.
      if (ctx.part) named.push([`druxt-branding__${ctx.part}`])
      break
    case 'language-switcher':
      // The list, `druxt-language-switcher`, each item, `__item`, and each link, `__link`, with a variant such as
      // `--untranslated`.
      if (ctx.part === 'language-item') named.push(['druxt-language-switcher__item'])
      else if (ctx.part === 'language-link') {
        named.push(['druxt-language-switcher__link'])
        if (ctx.variant) named.push([`druxt-language-switcher__link--${slug(ctx.variant)}`])
      } else named.push(['druxt-language-switcher'])
      break
    case 'menu':
      named.push(['druxt-menu'])
      if (ctx.menu) named.push([`druxt-menu--${slug(ctx.menu)}`, 'name'])
      break
    case 'link':
      // A menu's link. A breadcrumb's is named above, by its own context field.
      if (ctx.menu === undefined) break
      if (ctx.part === 'toggle') {
        named.push(['druxt-menu__toggle'])
        break
      }
      named.push(['druxt-menu__link'])
      if (ctx.active) named.push(['druxt-menu__link--active'])
      break
    case 'entity':
      named.push(['druxt-entity'])
      add(ctx.mode, 'druxt-entity', 'mode')
      named.push(...typeClass('druxt-entity', ctx, keep))
      break
    case 'field':
      named.push(['druxt-field'], ['druxt-field--standalone'])
      named.push(...typeClass('druxt-field', ctx, keep))
      add(ctx.field, 'druxt-field', 'field')
      break
    case 'label':
      if (ctx.part === 'entity') {
        named.push(['druxt-entity__label'])
        break
      }
      named.push(['druxt-field__label'])
      if (ctx.position) named.push([`druxt-field__label--${slug(ctx.position)}`])
      add(ctx.field, 'druxt-field__label', 'field')
      break
    case 'items':
      named.push(['druxt-field__items'])
      add(ctx.field, 'druxt-field__items', 'field')
      break
    case 'item':
      if (ctx.part) {
        named.push([`druxt-field__${ctx.part}`])
        if (ctx.variant) named.push([`druxt-field__${ctx.part}--${slug(ctx.variant)}`])
        break
      }
      named.push(['druxt-field__item'])
      add(ctx.kind, 'druxt-field__item', 'kind')
      add(ctx.formatter, 'druxt-field__item', 'formatter')
      add(ctx.field, 'druxt-field__item', 'field')
      if (ctx.multiple) named.push(['druxt-field__item--multiple', 'multiple'])
      break
    case 'form':
    case 'widget':
      if (ctx.part) {
        named.push([`druxt-form__${ctx.part}`])
        if (ctx.variant) named.push([`druxt-form__${ctx.part}--${slug(ctx.variant)}`])
        break
      }
      if (ctx.element === 'form') {
        named.push(['druxt-entity-form'])
        break
      }
      named.push(['druxt-form__widget'])
      add(ctx.kind, 'druxt-form__widget', 'kind')
      break
  }
  return [...new Set(named.filter(([, modifier]) => !modifier || keep(modifier)).map(([name]) => name))]
}

/** The policy part an element's classes belong to. */
const PART: Record<DruxtClassElement, keyof Omit<DruxtClassPolicyParts, 'modifiers'>> = {
  entity: 'entity',
  field: 'field',
  label: 'label',
  item: 'items',
  items: 'items',
  form: 'form',
  widget: 'form',
  menu: 'menu',
  link: 'menu',
  breadcrumb: 'breadcrumb',
  block: 'block',
  branding: 'block',
  'language-switcher': 'block',
}

/** The policy part a class list belongs to: a menu's or a breadcrumb's item and list are its own, not a field's. */
const partOf = (ctx: DruxtClassContext): keyof Omit<DruxtClassPolicyParts, 'modifiers'> => {
  if (ctx.menu !== undefined) return 'menu'
  if (ctx.breadcrumb) return 'breadcrumb'
  return PART[ctx.element]
}

/**
 * The classes Druxt outputs on an element: its naming rules' classes, filtered by the site's policy, then rewritten by
 * the override hook, if any.
 *
 * The policy is `true` for every class, `false` for none, or the parts to keep. An unknown value counts as `true`.
 * The hook runs whatever the policy, so with `false` it receives an empty list and may add the site's own classes.
 *
 * @param policy - `druxt.classes`.
 * @param ctx - What the list is for.
 * @param hook - The site's override, from `defineDruxtClasses()`.
 * @returns The classes, each once.
 *
 * @example @lang js
 * resolveDruxtClasses({ modifiers: ['field'] }, { element: 'item', kind: 'text', formatter: 'text_default', field: 'body' })
 * // ['druxt-field__item', 'druxt-field__item--body']
 */
export function resolveDruxtClasses(policy: DruxtClassPolicy | undefined, ctx: DruxtClassContext, hook?: DruxtClassHook): string[] {
  let classes: string[]
  if (policy === false) classes = []
  else if (policy && typeof policy === 'object') {
    const modifiers = Array.isArray(policy.modifiers) ? policy.modifiers : undefined
    classes = policy[partOf(ctx)] === false ? [] : druxtClassNames(ctx, (modifier) => !modifiers || modifiers.includes(modifier))
  } else classes = druxtClassNames(ctx)
  if (!hook) return classes
  return [...new Set(hook([...classes], { ...ctx }).filter((name) => typeof name === 'string' && name))]
}

/**
 * Several hooks as one, each rewriting the last one's list, in the order given.
 *
 * @param hooks - The hooks.
 * @returns One hook, or `undefined` for none.
 */
export function composeDruxtClassHooks(hooks: readonly DruxtClassHook[]): DruxtClassHook | undefined {
  if (!hooks.length) return undefined
  return (classes, ctx) => hooks.reduce((list, hook) => hook(list, ctx), classes)
}
