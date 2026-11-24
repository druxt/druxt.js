import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'
import { moduleTemplates } from '../../packages/core/src/runtime/devel/utils/devtools'
import { DruxtTemplateError, renderTemplate, templatePath, validateTemplateRequest } from '../../packages/core/src/runtime/utils/template'

const entity = {
  component: 'DruxtEntity',
  name: 'DruxtEntityNodePageDefaultView',
  props: ['entity', 'fields', 'schema', 'modelValue'],
  slots: ['title', 'body', 'default', 'debug'],
  template: {
    debug: '{ entity, schema }',
    from: '@druxt/entity/runtime',
    props: 'druxtEntityProps',
    composable: { name: 'useDruxtEntity', use: ['classes'] },
    druxt: { 'query.//fields': ['name', 'path', 'title'], 'query.//schema': true },
  },
}

describe('the development template tool', () => {
  it('writes a script setup wrapper with the module\'s props, settings and named slots', () => {
    const source = renderTemplate(validateTemplateRequest(entity))
    expect(source).toContain('<script setup lang="ts">')
    // Neither the composable's `classes` nor the model is read by the template, so neither is declared.
    expect(source).toContain('import { druxtEntityProps } from \'@druxt/entity/runtime\'')
    expect(source).toContain('\ndefineProps(druxtEntityProps)')
    expect(source).toContain('\ndefineModel<unknown>()')
    expect(source).not.toContain('useDruxtEntity')
    expect(source).toContain('defineOptions({')
    expect(source).toContain('      // fields: ["name","path","title"],')
    expect(source).toContain('<DruxtDebug :json="{ entity, schema }" />')
    expect(source).toContain('<slot name="title" />')
    expect(source).not.toContain('<slot name="default" />')
    expect(source).not.toContain('defineComponent')
  })

  it('imports no composable when it declares nothing to use', () => {
    const source = renderTemplate(validateTemplateRequest({
      ...entity,
      template: { ...entity.template, composable: { name: 'useX', use: [] } },
    }))
    expect(source).not.toContain('useX')
  })

  it('declares the props by name when the module has no props object', () => {
    const source = renderTemplate(validateTemplateRequest({ component: 'DruxtSite', name: 'DruxtSiteUmami', props: ['regions', 'theme', 'modelValue'], template: {} }))
    expect(source).toContain('defineProps([\'regions\', \'theme\'])')
    expect(source).toContain('\ndefineModel<unknown>()')
    expect(source).toContain('<DruxtDebug :json="$props" />')
  })

  // DruxtField's request as the create action sends it: one `field-<delta>` slot per value the instance rendered.
  const field = (values: number) => ({
    component: 'DruxtField',
    name: 'DruxtFieldEntityReferenceLabelFieldTags',
    props: ['schema', 'modelValue', 'errors'],
    slots: ['label', ...Array.from({ length: values }, (_, delta) => `field-${delta}`), 'default'],
    template: {
      debug: '{ schema, modelValue }',
      from: '@druxt/entity/runtime',
      props: 'druxtFieldProps',
      composable: { name: 'useDruxtField', use: ['items', 'label'] },
      repeat: { prefix: 'field-', over: 'items' },
    },
  })

  it('writes one slot in a v-for for the values, the same for no value, 1 or 20', () => {
    const one = renderTemplate(validateTemplateRequest(field(1)))
    expect(renderTemplate(validateTemplateRequest(field(20)))).toBe(one)
    expect(renderTemplate(validateTemplateRequest(field(0)))).toBe(one)
    expect(one).toContain('<slot v-for="i in items.length" :key="i" :name="`field-${i - 1}`" />')
    expect(one).not.toContain('name="field-0"')
    // `items` is read, `label` and the model are not.
    expect(one).toContain('const props = defineProps(druxtFieldProps)')
    expect(one).toContain('const { items } = useDruxtField(props)')
    expect(one).toContain('\ndefineModel<unknown>()')
    expect(one).toContain('<slot name="label" />')
  })

  // Written into a site, the file is the site's own code: it passes the repository's lint rules as it is.
  it('writes files that lint clean', async () => {
    const eslint = new ESLint({ cwd: fileURLToPath(new URL('../..', import.meta.url)) })
    // The ported modules, which give a props object. One without, declared by name, gets untyped props.
    for (const request of [entity, field(20)]) {
      const checked = validateTemplateRequest(request)
      // Where the tool writes it, so the component's name is the wrapper's.
      const [result] = await eslint.lintText(renderTemplate(checked), { filePath: fileURLToPath(new URL(`./components/${templatePath(checked)}`, import.meta.url)) })
      expect(result!.messages.map((m) => `${m.ruleId}: ${m.message}`), request.name).toEqual([])
    }
  }, 60_000)

  it('places the file where Nuxt names it the wrapper again', () => {
    expect(templatePath(validateTemplateRequest(entity))).toBe('druxt/entity/NodePageDefaultView.vue')
    expect(templatePath(validateTemplateRequest({ component: 'DruxtBlockRegion', name: 'DruxtBlockRegionHeaderUmami' }))).toBe('druxt/block/region/HeaderUmami.vue')
  })

  it.each([
    ['a name outside the module', { ...entity, name: 'DruxtMenuMain' }],
    ['the module\'s own name', { ...entity, name: 'DruxtEntity' }],
    ['a path in the name', { ...entity, name: 'DruxtEntity../../x' }],
    ['a prop that breaks out', { ...entity, props: ['x\'], setup() {}, a: [\''] }],
    ['a debug expression with quotes', { ...entity, template: { debug: '"><img onerror="alert(1)' } }],
    ['an import that breaks out', { ...entity, template: { ...entity.template, from: 'x\'; import(\'evil' } }],
    ['a props object that is not a name', { ...entity, template: { ...entity.template, props: 'a); evil(' } }],
    ['a composable value that is not a name', { ...entity, template: { ...entity.template, composable: { name: 'useX', use: ['a } = evil()'] } } }],
    ['a composable name that is not a name', { ...entity, template: { ...entity.template, composable: { name: 'a); evil(', use: ['classes'] } } }],
    ['a setting that closes the script', { ...entity, template: { druxt: { query: '</script><script>alert(1)</script>' } } }],
    ['a slot name with markup', { ...entity, slots: ['a"><b'] }],
    ['a component that is not a Druxt module', { ...entity, component: 'Evil', name: 'EvilX' }],
    ['a repeated slot prefix with markup', { ...entity, template: { ...entity.template, repeat: { prefix: 'a"><b', over: 'items' } } }],
    ['a repeated slot value that is not a name', { ...entity, template: { ...entity.template, repeat: { prefix: 'field-', over: 'a; evil()' } } }],
    ['a settings path through __proto__', { ...entity, template: { druxt: { '__proto__.polluted': 1 } } }],
    ['a settings path through constructor', { ...entity, template: { druxt: { 'constructor.polluted': 1 } } }],
    ['a settings path through a nested __proto__', { ...entity, template: { druxt: { 'a.__proto__.polluted': 1 } } }],
    ['a settings path through constructor.prototype', { ...entity, template: { druxt: { 'constructor.prototype.polluted': 1 } } }],
    ['a settings path through an inherited method', { ...entity, template: { druxt: { 'toString.polluted': 1 } } }],
    ['a settings path ending in an inherited name', { ...entity, template: { druxt: { 'query.hasOwnProperty': 1 } } }],
    ['a commented settings path through __proto__', { ...entity, template: { druxt: { 'a.//__proto__': 1 } } }],
    ['a settings path with an empty part', { ...entity, template: { druxt: { 'query..fields': 1 } } }],
    ['a settings path commented before its end', { ...entity, template: { druxt: { '//query.fields': 1 } } }],
    ['settings that are a list', { ...entity, template: { druxt: ['a'] } }],
    ['a settings path that is a value and a parent', { ...entity, template: { druxt: { query: 1, 'query.fields': ['title'] } } }],
    ['a settings path that is a parent and a value', { ...entity, template: { druxt: { 'query.fields': ['title'], query: 1 } } }],
    ['a settings path that is a value and a commented parent', { ...entity, template: { druxt: { query: 1, 'query.//fields': ['title'] } } }],
    ['repeated slots that are null', { ...entity, template: { ...entity.template, repeat: null } }],
    ['repeated slots that are not an object', { ...entity, template: { ...entity.template, repeat: 'field-' } }],
    ['a composable that is null', { ...entity, template: { ...entity.template, composable: null } }],
    ['a slots setting that is not a boolean', { ...entity, template: { ...entity.template, slots: 'none' } }],
  ])('refuses %s', (_label, request) => {
    expect(() => validateTemplateRequest(request)).toThrow(DruxtTemplateError)
  })

  // The check refuses these paths; a caller that skips it still reaches no prototype.
  it.each([
    '__proto__.polluted',
    'constructor.polluted',
    'a.__proto__.polluted',
    'constructor.prototype.polluted',
    'toString.polluted',
  ])('writes nothing onto Object or its prototype for %s, unchecked', (path) => {
    const before = [Object.prototype, Object, Object.prototype.toString].map((target) => Object.getOwnPropertyNames(target))
    try {
      renderTemplate({ ...entity, template: { druxt: { [path]: 1 } } })
      expect([Object.prototype, Object, Object.prototype.toString].map((target) => Object.getOwnPropertyNames(target))).toEqual(before)
      expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    } finally {
      for (const target of [Object.prototype, Object, Object.prototype.toString]) delete (target as unknown as Record<string, unknown>).polluted
    }
  })

  it('accepts slots: false and writes no named slot', () => {
    const source = renderTemplate(validateTemplateRequest({ ...entity, template: { ...entity.template, slots: false } }))
    expect(source).not.toContain('<slot name="title" />')
  })

  // The debug slot is not content, so it does not count as a named slot that stands in for the default slot.
  it('keeps the default slot when the only other slot is the debug slot', () => {
    const source = renderTemplate(validateTemplateRequest({ ...entity, slots: ['default', 'debug'] }))
    expect(source).toContain('<slot name="default" />')
    expect(source).not.toContain('<slot name="debug" />')
  })

  // The DevTools tab offers these names; DruxtDevelTemplate offers the same, by the same test.
  it('offers only names the route accepts: past the module\'s own, its own prefix, letters and digits', () => {
    const candidates = ['DruxtEntityNodePageDefaultView', 'DruxtEntityNodePage', 'DruxtEntity', 'DruxtEntityNodePage--es', 'DruxtMenuMain', 'druxtentityLower']
    const offered = moduleTemplates({ component: 'DruxtEntity', candidates, props: [], slots: [], template: {} }).map(({ name }) => name)
    expect(offered).toEqual(['DruxtEntityNodePageDefaultView', 'DruxtEntityNodePage'])
    for (const name of offered) expect(() => validateTemplateRequest({ component: 'DruxtEntity', name })).not.toThrow()
  })
})
