import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadNuxt } from 'nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import { afterAll, describe, expect, it } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const css = readFileSync(join(root, 'packages/core/src/runtime/assets/druxt.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/** A selector list's selectors: split at each comma outside parentheses, however deeply they nest. */
const topLevel = (prelude: string): string[] => {
  const parts = ['']
  let depth = 0
  for (const char of prelude) {
    if (char === '(') depth++
    if (char === ')') depth--
    if (char === ',' && !depth) parts.push('')
    else parts[parts.length - 1] += char
  }
  return parts.map((part) => part.trim())
}

/** Each rule's selector list and body. An at-rule's block holds rules, so it never matches as one, and keyframe steps are left out. */
const rules = (source: string): { selectors: string[], body: string }[] =>
  [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, prelude, body]) => ({ prelude: prelude!.trim(), body: body! }))
    .filter(({ prelude }) => prelude && !prelude.startsWith('@') && !/^(?:from|to|\d+%)$/.test(prelude))
    .map(({ prelude, body }) => ({ selectors: topLevel(prelude), body }))

const properties = (body: string): string[] => [...body.matchAll(/(--druxt-[\w-]+)\s*:/g)].map(([, name]) => name!)

/** The `@layer druxt` block's contents, and the stylesheet without it. */
const layer = (source: string): { inside: string, outside: string } => {
  const start = source.indexOf('@layer druxt {')
  let depth = 0
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}' && !--depth) {
      return { inside: source.slice(source.indexOf('{', start) + 1, i), outside: source.slice(0, start) + source.slice(i + 1) }
    }
  }
  throw new Error('No @layer druxt block')
}
const { inside, outside } = layer(css)

describe('the development stylesheet', () => {
  it('sets the ten tokens at zero specificity, the five colours following the page\'s colour scheme', () => {
    const tokens = rules(css).filter((rule) => rule.selectors.join() === ':where(:root)')
    expect(tokens.map((rule) => properties(rule.body))).toEqual([
      ['--druxt-ink', '--druxt-surface', '--druxt-accent', '--druxt-danger', '--druxt-success', '--druxt-focus', '--druxt-space', '--druxt-radius', '--druxt-font', '--druxt-mono'],
      // The derived values, which are private.
      [],
    ])
    // Each colour is light unless the page declares a dark scheme, whatever the reader's system prefers.
    for (const [token, light, dark] of [['ink', '#16212b', '#e5ecf1'], ['surface', '#fff', '#15202a'], ['accent', '#1a6ca8', '#3498db'], ['danger', '#b3261e', '#f2827a'], ['success', '#0c7565', '#3fbfa8']]) {
      expect(tokens[0]!.body).toContain(`--druxt-${token}: light-dark(${light}, ${dark});`)
    }
    expect(css).not.toContain('prefers-color-scheme')
    // A page that marks itself dark with data-theme, on any ancestor, darkens Druxt's output, in the layer.
    const theme = rules(inside).find((rule) => rule.selectors.some((selector) => selector.includes('[data-theme="dark"]')))
    expect(theme?.selectors).toEqual([':is(.druxt-entity, .druxt-entity-form, .druxt-field):where([data-theme="dark"] *)'])
    expect(theme?.body).toMatch(/color-scheme: dark;/)
  })

  it('scopes every other rule outside the layer to a tool, so nothing reaches the site', () => {
    for (const { selectors } of rules(outside)) {
      for (const selector of selectors) {
        if (selector === ':where(:root)' || selector === '.druxt-field__label--hidden') continue
        expect(selector, selector).toMatch(/^(?::is\()?\.druxt-(?:devel-[\w-]+|debug)/)
        // A sibling combinator outside a pseudo-class's parentheses would reach past the tool, into the site.
        expect(selector.replace(/\([^()]*\)/g, ''), selector).not.toMatch(/[+~]/)
      }
    }
    expect([...css.matchAll(/@keyframes ([\w-]+)/g)].map(([, name]) => name)).toEqual(['druxt-devel-spin'])
  })

  it('layers every field, entity and form rule, so any site rule outside a layer wins', () => {
    const layered = rules(inside)
    expect(layered.length).toBeGreaterThan(20)
    for (const { selectors } of layered) {
      for (const selector of selectors) expect(selector, selector).toMatch(/^(?::is\()?(?:img|fieldset)?\.druxt-(?:field|entity|form)(?:__|\b)/)
    }
    // The form's rules, from the design: its widgets, the checkbox before its label, the alert, the buttons and the status.
    for (const selector of ['.druxt-entity-form', 'fieldset.druxt-form__widget', '.druxt-form__widget--checkbox', '.druxt-form__alert', '.druxt-entity-form > [type=submit]', '.druxt-entity-form > button:disabled', '.druxt-form__status--saved']) {
      expect(layered.some((rule) => rule.selectors.includes(selector)), selector).toBe(true)
    }
    // The required mark: a control's label, a checkbox's, and the legend of a fieldset whose own control is required.
    expect(inside).toContain('fieldset.druxt-form__widget:has(> :required, > div > :required) > legend)::after')
    // Scoped to the checkbox widget, so a site's own required checkbox is never marked.
    expect(inside).toContain('.druxt-form__widget--checkbox [type=checkbox]:required + label')
    expect(inside).not.toMatch(/[(,]\s*\[type=checkbox\]:required/)
    // A multi-value field's list loses its bullets, and its items keep the gaps and dots single values have.
    expect(layered.find((rule) => rule.selectors.includes('.druxt-field__items'))?.body).toMatch(/list-style: none;[\s\S]*margin: 0;[\s\S]*padding: 0;/)
    expect(inside).toContain('.druxt-field__label--hidden + :is(.druxt-field__item, .druxt-field__items)')
    expect(inside).toContain('.druxt-field__label--inline + .druxt-field__items')
    // A standalone field's root has no gap above its first part, as an entity's root has none.
    expect(layered.find((rule) => rule.selectors.includes('.druxt-field--standalone > :first-child'))?.body).toMatch(/margin-top: 0;/)
  })

  // A site rule such as `.druxt-field__label { display: block }`, outside a layer, outranks any layered rule. The
  // hidden label's rule is outside the layer too, with its class's specificity, so the site's rule cannot reveal it.
  // happy-dom has no cascade layers, so the rule's place is read from the stylesheet.
  it('keeps a hidden label for screen readers outside the layer, where a site rule outside a layer cannot reveal it', () => {
    const hidden = rules(outside).filter((rule) => rule.selectors.includes('.druxt-field__label--hidden'))
    expect(hidden).toHaveLength(1)
    expect(hidden[0]!.selectors).toEqual(['.druxt-field__label--hidden'])
    expect(hidden[0]!.body).toMatch(/position: absolute;[\s\S]*clip-path: inset\(50%\);/)
    expect(rules(inside).some((rule) => rule.selectors.includes('.druxt-field__label--hidden'))).toBe(false)
  })

  it('declares no token outside :root, and derives the rest privately', () => {
    for (const { selectors, body } of rules(css)) {
      if (selectors.join() !== ':where(:root)') expect(properties(body), selectors.join()).toEqual([])
    }
  })

  it('moves only for those who have not asked for less', () => {
    const animated = [...css.matchAll(/animation:/g)].length
    const motion = /@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?\}\s*)\}/.exec(css)![1]!
    expect([...motion.matchAll(/animation:/g)].length).toBe(animated)
  })
})

const loaded: Nuxt[] = []
afterAll(async () => {
  for (const nuxt of loaded) await nuxt.close()
})

/** The app's stylesheets, its DruxtDevelTemplate, its plugins, its Nuxt DevTools tabs and its dev server routes, in development or not. */
const load = async (dev: boolean) => {
  const nuxt = await loadNuxt({ cwd: join(root, 'test/unit/fixtures/core-module'), dev, ready: true, overrides: { _prepare: true } as Record<string, unknown> })
  loaded.push(nuxt)
  const components: Array<{ pascalName: string, filePath: string }> = []
  await nuxt.callHook('components:extend', components as never)
  const tabs: Array<{ name: string, title: string, icon: string, view: { type: string, src: string } }> = []
  await (nuxt.callHook as (name: string, ...args: unknown[]) => Promise<void>)('devtools:customTabs', tabs)
  return {
    css: nuxt.options.css,
    template: components.find((component) => component.pascalName === 'DruxtDevelTemplate')?.filePath,
    plugins: nuxt.options.plugins.map((plugin) => typeof plugin === 'string' ? plugin : plugin.src),
    tabs,
    routes: nuxt.options.devServerHandlers.map((handler) => handler.route),
  }
}

describe('the core module\'s development stylesheet', () => {
  it('is added in development, with the Druxt tab in Nuxt DevTools and its page', async () => {
    const app = await load(true)
    expect(app.css.filter((file) => file.endsWith('assets/druxt.css'))).toHaveLength(1)
    expect(app.template).toMatch(/components\/DruxtDevelTemplate\.vue$/)
    // The icon as a path on the dev server: Nuxt DevTools takes any other string as a class, and shows no image.
    expect(app.tabs).toEqual([{ name: 'druxt', title: 'Druxt', icon: '/__druxt/devtools/icon.svg', category: 'app', view: { type: 'iframe', src: '/__druxt/devtools' } }])
    expect(app.routes).toContain('/__druxt/devtools')
    expect(app.routes).toContain('/__druxt/devtools/icon.svg')
    expect(app.plugins.filter((src) => /plugins\/devel(?:-requests)?\./.test(src))).toHaveLength(2)
  }, 120_000)

  it('is left out of production, with the create action that renders nothing, and no DevTools tab', async () => {
    const app = await load(false)
    expect(app.css.some((file) => file.includes('druxt'))).toBe(false)
    expect(app.template).toMatch(/components\/DruxtDevelTemplateProduction\.(?:ts|js)$/)
    expect(app.tabs).toEqual([])
    expect(app.routes).not.toContain('/__druxt/devtools')
    expect(app.routes).not.toContain('/__druxt/devtools/icon.svg')
    expect(app.plugins.some((src) => /devel/.test(src))).toBe(false)
  }, 120_000)
})
