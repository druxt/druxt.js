// The development template tool: turns a request from DruxtDevelTemplate into
// a wrapper component file. The dev server checks each part of the request,
// which comes from a browser, before it reaches the file. DruxtDevelTemplate
// renders the same path and source as its preview.

import type { DruxtTemplateConfig } from '../types'

/** What DruxtDevelTemplate sends. */
export interface DruxtTemplateRequest {
  /** The module component, such as DruxtEntity. */
  component: string
  /** The wrapper to create, one of the module's candidate names. */
  name: string
  /** The props the module hands its wrapper. */
  props?: string[]
  /** The module's slot names. */
  slots?: string[]
  template?: DruxtTemplateConfig
}

const IDENTIFIER = /^[a-z_$][\w$]*$/i
const COMPONENT = /^Druxt[A-Za-z0-9]+$/
const SLOT = /^[\w-]+$/
const SPECIFIER = /^(?:@[a-z0-9-]+\/)?[a-z0-9-]+(?:\/[a-z0-9-]+)*$/
const DEBUG = /^[\w$.,{}[\] ]+$/
// A settings path: names joined by dots, the last of which may start `//`.
const PATH = /^(?:[a-z_$][\w$]*\.)*(?:\/\/)?[a-z_$][\w$]*$/i
// A name an object inherits, such as `__proto__` or `toString`, or a function's `prototype`.
const inherited = (key: string): boolean => key in Object.prototype || key === 'prototype'

/** A request that fails a check. */
export class DruxtTemplateError extends Error {}

const fail = (message: string): never => {
  throw new DruxtTemplateError(message)
}

/**
 * Whether a candidate name is a wrapper the tool can create for a module: letters and digits only, past the module's
 * own name, which it starts with. DruxtDevelTemplate and the DevTools tab offer these names, and the dev server
 * refuses any other.
 *
 * @param component - The module component, such as DruxtEntity.
 * @param name - The candidate name.
 */
export const isTemplateName = (component: string, name: string): boolean =>
  /^[a-z0-9]+$/i.test(name) && name.startsWith(component) && name !== component

/**
 * Checks a request; throws DruxtTemplateError on the first part that fails.
 *
 * @param request - The request body, as received.
 */
export function validateTemplateRequest(request: unknown): DruxtTemplateRequest {
  const body = (request && typeof request === 'object' ? request : {}) as Record<string, unknown>
  const { component, name, props = [], slots = [], template = {} } = body as unknown as DruxtTemplateRequest
  if (typeof component !== 'string' || !COMPONENT.test(component)) fail('Unsupported component.')
  if (typeof name !== 'string' || !isTemplateName(component, name)) fail('Unsupported name: it must be one of the module\'s wrapper names.')
  if (!Array.isArray(props) || !props.every((p) => typeof p === 'string' && IDENTIFIER.test(p))) fail('Unsupported props.')
  if (!Array.isArray(slots) || !slots.every((s) => typeof s === 'string' && SLOT.test(s))) fail('Unsupported slots.')
  if (!template || typeof template !== 'object') fail('Unsupported template settings.')
  if (template.debug !== undefined && (typeof template.debug !== 'string' || !DEBUG.test(template.debug))) fail('Unsupported debug expression.')
  if (template.from !== undefined && (typeof template.from !== 'string' || !SPECIFIER.test(template.from))) fail('Unsupported import.')
  if (template.props !== undefined && (typeof template.props !== 'string' || !IDENTIFIER.test(template.props))) fail('Unsupported props object.')
  if (template.repeat !== undefined) {
    const { prefix, over } = template.repeat as { prefix?: unknown, over?: unknown }
    if (typeof prefix !== 'string' || !SLOT.test(prefix) || typeof over !== 'string' || !IDENTIFIER.test(over)) fail('Unsupported repeated slots.')
  }
  if (template.composable !== undefined) {
    const { name, use } = template.composable as { name?: unknown, use?: unknown }
    if (typeof name !== 'string' || !IDENTIFIER.test(name) || !Array.isArray(use) || !use.every((u) => typeof u === 'string' && IDENTIFIER.test(u))) fail('Unsupported composable.')
  }
  if (template.slots !== undefined && typeof template.slots !== 'boolean') fail('Unsupported slots setting.')
  if (template.druxt !== undefined && (!template.druxt || typeof template.druxt !== 'object' || Array.isArray(template.druxt))) fail('Unsupported druxt settings.')
  const keys = Object.keys(template.druxt || {}).map((path) => path.split('.').map((part) => part.replace(/^\/\//, '')).join('.'))
  for (const [path, value] of Object.entries(template.druxt || {})) {
    // A value in a .vue file must not close its script block, and a name must not reach an object's prototype.
    if (!PATH.test(path) || path.split('.').some((part) => inherited(part.replace(/^\/\//, ''))) || JSON.stringify(value)?.includes('<')) fail('Unsupported druxt settings.')
  }
  // A path is a value or holds others, never both.
  for (const key of keys) {
    if (keys.some((other) => other.startsWith(`${key}.`))) fail(`Unsupported druxt settings: ${key} is both a value and a parent.`)
  }
  return { component, name, props, slots, template }
}

/**
 * The wrapper's file path, under the components directory: DruxtEntity's
 * `DruxtEntityNodePageDefaultView` is `druxt/entity/NodePageDefaultView.vue`,
 * which Nuxt names DruxtEntityNodePageDefaultView again.
 *
 * @param request - A checked request.
 */
export function templatePath({ component, name }: DruxtTemplateRequest): string {
  const prefix = component.replace(/^Druxt/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().split('-')
  return ['druxt', ...prefix, `${name.slice(component.length)}.vue`].join('/')
}

/**
 * The wrapper component's source: `<script setup>`, with the module's props
 * object and composable when it has them.
 *
 * @param request - A checked request.
 */
export function renderTemplate({ props = [], slots = [], template = {} }: DruxtTemplateRequest): string {
  // The template first: the script declares only the names it uses, so the file lints clean.
  // Named slots, past the default and the debug ones, unless the module wants none.
  const slotNames = template.slots === false ? [] : (slots.length > 1 ? slots.filter((s) => s !== 'default') : slots).filter((s) => s !== 'debug')
  const debug = template.debug || '$props'
  const repeat = template.repeat
  const repeated = (s: string) => !!repeat && s.startsWith(repeat.prefix) && /^\d+$/.test(s.slice(repeat.prefix.length))
  const slotLines: string[] = []
  const loop = repeat && template.slots !== false ? `    <slot v-for="i in ${repeat.over}.length" :key="i" :name="\`${repeat.prefix}\${i - 1}\`" />` : undefined
  for (const s of slotNames) {
    if (!repeated(s)) slotLines.push(`    <slot name="${s}" />`)
    // One for every value, at the first value's place.
    else if (s === slotNames.find(repeated)) slotLines.push(loop!)
  }
  // The loop even when the instance had no value: the wrapper serves every instance, and another may have several.
  if (loop && !slotLines.includes(loop)) slotLines.push(loop)
  const markup = [`    <DruxtDebug :json="${debug}" />`, ...slotLines].join('\n')
  // What the template's expressions read: the debug expression, and the value the repeated slots loop over. A slot's
  // name, such as `label`, is not an expression.
  const expressions = [debug, loop ? repeat!.over : ''].join(' ')
  const used = (name: string) => new RegExp(`(?:^|[^\\w$])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w$])`).test(expressions)
  const use = (template.composable?.use || []).filter(used)

  const script: string[] = []

  const imported = [template.props, use.length ? template.composable!.name : undefined].filter((name): name is string => !!name)
  if (template.from && imported.length) script.push(`import { ${imported.join(', ')} } from '${template.from}'`, '')

  // Settings by dotted path, nested; a part marked `//` is written commented out.
  const settings = Object.entries(template.druxt || {})
  if (settings.length) {
    // Without a prototype, and read by own keys only, so no path reaches Object.prototype, whatever it names.
    const tree: Record<string, unknown> = Object.create(null)
    for (const [path, value] of settings) {
      const parts = path.split('.')
      let node = tree
      for (const part of parts.slice(0, -1)) {
        if (!Object.hasOwn(node, part)) node[part] = Object.create(null)
        node = node[part] as Record<string, unknown>
      }
      const last = parts[parts.length - 1]!
      const commented = last.startsWith('//')
      const key = last.replace(/^\/\//, '')
      node[key] = `${commented ? '// ' : ''}${key}: ${JSON.stringify(value)},`
    }
    const write = (node: Record<string, unknown>, depth: number): string[] => Object.entries(node).flatMap(([key, value]) => typeof value === 'string'
      ? [`${'  '.repeat(depth)}${value}`]
      : [`${'  '.repeat(depth)}${key}: {`, ...write(value as Record<string, unknown>, depth + 1), `${'  '.repeat(depth)}},`])
    script.push('defineOptions({', '  druxt: {', ...write(tree, 2), '  },', '})', '')
  }

  // defineModel() declares modelValue itself, so it never goes through defineProps.
  // A name is assigned only when something reads it: the composable reads `props`, the template reads `model`.
  const named = props.filter((p) => p !== 'modelValue')
  const composable = use.length && template.from ? template.composable!.name : undefined
  const propsName = composable && template.props ? 'const props = ' : ''
  if (template.props && template.from) script.push(`${propsName}defineProps(${template.props})`)
  else if (named.length) script.push(`defineProps([${named.map((p) => `'${p}'`).join(', ')}])`)
  if (props.includes('modelValue')) script.push(`${used('model') ? 'const model = ' : ''}defineModel<unknown>()`)
  if (composable) script.push(`const { ${use.join(', ')} } = ${composable}(${template.props ? 'props' : ''})`)

  return [
    '<!-- Generated by the Druxt development template tool. -->',
    '<template>',
    '  <div>',
    markup,
    '  </div>',
    '</template>',
    '',
    '<script setup lang="ts">',
    ...script,
    '</script>',
    '',
  ].join('\n')
}
