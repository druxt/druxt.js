import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount } from '@vue/test-utils'
import { createError, defineEventHandler } from 'h3'
import { DruxtDebug, DruxtDevelTemplate } from '#components'
import { settle } from './helpers'

enableAutoUnmount(afterEach)

describe('the create action', () => {
  const props = { component: 'DruxtTest', options: ['DruxtTestNodeArticle', 'DruxtTestDefault'], props: ['entity'], slots: ['default'] }

  it('previews the path and starter for the chosen name, with a label for its select', async () => {
    const template = await mountSuspended(DruxtDevelTemplate, { props })
    const select = template.find('select')
    expect(template.find('label').attributes('for')).toBe(select.attributes('id'))
    expect(template.find('.druxt-devel-template__path').text()).toBe('components/druxt/test/NodeArticle.vue')
    expect(template.find('.druxt-devel-template__preview pre').text()).toContain('<DruxtDebug :json="$props" />')
    await select.setValue('DruxtTestDefault')
    expect(template.find('.druxt-devel-template__path').text()).toBe('components/druxt/test/Default.vue')
  })

  // The same names the DevTools tab offers: test/unit/template.test.ts.
  it('offers only names the route accepts', async () => {
    const template = await mountSuspended(DruxtDevelTemplate, { props: { ...props, options: ['DruxtTestNodeArticle', 'DruxtTest', 'DruxtTestNodeArticle--es', 'DruxtMenuMain', 'DruxtTestDefault'] } })
    expect(template.findAll('option').map((option) => option.attributes('value'))).toEqual(['DruxtTestNodeArticle', 'DruxtTestDefault'])
  })

  // The module's candidates change with its inputs, while the tool stays mounted. The path shows the chosen name.
  it('chooses the first name that remains when its candidates change, and keeps a name that is still one', async () => {
    const template = await mountSuspended(DruxtDevelTemplate, { props })
    const path = () => template.find('.druxt-devel-template__path').text()
    await template.setProps({ options: ['DruxtTestNodePage', 'DruxtTestDefault'] } as Record<string, unknown>)
    expect(path()).toBe('components/druxt/test/NodePage.vue')
    await template.find('select').setValue('DruxtTestDefault')
    await template.setProps({ options: ['DruxtTestNodeRecipe', 'DruxtTestDefault'] } as Record<string, unknown>)
    expect(path()).toBe('components/druxt/test/Default.vue')
  })

  it('is busy while the request is in flight, then announces done as a status', async () => {
    let answer: () => void = () => {}
    registerEndpoint('/api/_druxt/template', {
      method: 'POST',
      handler: defineEventHandler(() => new Promise((resolve) => {
        answer = () => resolve({ file: '/app/components/druxt/test/NodeArticle.vue' })
      })),
    })
    const template = await mountSuspended(DruxtDevelTemplate, { props })
    await template.find('button').trigger('click')
    await settle(() => expect(template.attributes('aria-busy')).toBe('true'))
    expect(template.find('button').attributes('disabled')).toBeDefined()
    expect(template.find('button').text()).toBe('Creating')
    expect(template.find('.druxt-devel-template__spinner').exists()).toBe(true)
    answer()
    await settle(() => expect(template.find('[role="status"]').exists()).toBe(true))
    expect(template.find('[role="status"]').text()).toBe('Created components/druxt/test/NodeArticle.vue. Hot reload will swap it in.')
    expect(template.attributes('aria-busy')).toBe('false')
    expect(template.find('.druxt-devel-template__preview').exists()).toBe(false)
  })

  it('announces a refusal as an alert, says what to do, and offers to copy the starter', async () => {
    registerEndpoint('/api/_druxt/template', {
      method: 'POST',
      handler: defineEventHandler(() => {
        throw createError({ statusCode: 403, statusMessage: 'The template tool answers this machine only.' })
      }),
    })
    const template = await mountSuspended(DruxtDevelTemplate, { props })
    await template.find('button').trigger('click')
    await settle(() => expect(template.find('[role="alert"]').exists()).toBe(true))
    expect(template.find('[role="alert"]').text()).toBe('The file was not created. Wrapper files are only written when the dev server runs on localhost. Create the file yourself at components/druxt/test/NodeArticle.vue.')
    expect(template.find('.druxt-devel-template__copy').text()).toBe('Copy path and starter')
  })

  it('leaves out making the file by hand when the name exists', async () => {
    registerEndpoint('/api/_druxt/template', {
      method: 'POST',
      handler: defineEventHandler(() => {
        throw createError({ statusCode: 409, statusMessage: 'components/druxt/test/NodeArticle.vue exists already.' })
      }),
    })
    const template = await mountSuspended(DruxtDevelTemplate, { props })
    await template.find('button').trigger('click')
    await settle(() => expect(template.find('[role="alert"]').exists()).toBe(true))
    expect(template.find('[role="alert"]').text()).toBe('The file was not created. components/druxt/test/NodeArticle.vue exists already.')
    expect(template.find('.druxt-devel-template__copy').exists()).toBe(false)
  })

  describe('copying the path and starter', () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    afterEach(() => {
      if (original) Object.defineProperty(navigator, 'clipboard', original)
      else delete (navigator as { clipboard?: unknown }).clipboard
    })
    const clipboard = (value: unknown) => Object.defineProperty(navigator, 'clipboard', { value, configurable: true })

    const refused = async () => {
      registerEndpoint('/api/_druxt/template', {
        method: 'POST',
        handler: defineEventHandler(() => {
          throw createError({ statusCode: 403, statusMessage: 'The template tool answers this machine only.' })
        }),
      })
      const template = await mountSuspended(DruxtDevelTemplate, { props, attachTo: document.body })
      await template.find('button').trigger('click')
      await settle(() => expect(template.find('.druxt-devel-template__copy').exists()).toBe(true))
      await template.find('.druxt-devel-template__copy').trigger('click')
      await settle()
      return template
    }

    it('says Copied once the clipboard has it', async () => {
      const written: string[] = []
      clipboard({ writeText: async (text: string) => { written.push(text) } })
      const template = await refused()
      expect(template.find('.druxt-devel-template__copy').text()).toBe('Copied')
      expect(written[0]).toMatch(/^components\/druxt\/test\/NodeArticle\.vue\n\n<!-- Generated/)
    })

    it.each([
      ['missing, as on an origin that is not secure', undefined],
      ['refusing', { writeText: () => Promise.reject(new Error('Denied')) }],
    ])('shows the starter selected when the clipboard is %s', async (_, value) => {
      clipboard(value)
      const template = await refused()
      expect(template.find('.druxt-devel-template__copy').text()).toBe('Copy unavailable: select and copy below')
      const pre = template.find('.druxt-devel-template__preview pre')
      expect(pre.text()).toContain('<DruxtDebug :json="$props" />')
      expect(document.activeElement).toBe(pre.element)
      expect(window.getSelection()?.toString()).toContain('<DruxtDebug :json="$props" />')
    })
  })
})

describe('DruxtDebug', () => {
  const json = {
    type: 'node--recipe',
    id: 'a',
    attributes: { title: 'Pasta bake', promote: true, field_summary: 'x'.repeat(120) },
    relationships: { field_tags: { data: [] } },
  }

  it('is a disclosure, closed, with its type and size beside the title', async () => {
    const debug = await mountSuspended(DruxtDebug, { props: { json, summary: 'Debug', visible: true } })
    expect(debug.element.tagName).toBe('DETAILS')
    expect(debug.attributes('open')).toBeUndefined()
    expect(debug.find('.druxt-debug__title').text()).toBe('Debug')
    expect(debug.find('.druxt-debug__meta').text()).toBe('node--recipe · 4 keys')
  })

  it('takes a title as its summary, never as the root\'s tooltip, and passes other attributes to the root', async () => {
    const debug = await mountSuspended(DruxtDebug, { props: { visible: true }, attrs: { 'title': 'Route error', 'class': 'mine', 'data-test': 'x' } })
    expect(debug.find('.druxt-debug__title').text()).toBe('Route error')
    expect(debug.attributes('title')).toBeUndefined()
    expect(debug.classes()).toEqual(expect.arrayContaining(['druxt-debug', 'mine']))
    expect(debug.attributes('data-test')).toBe('x')
  })


  it('colours the JSON, and folds long strings and deep objects to buttons that expand in place', async () => {
    const debug = await mountSuspended(DruxtDebug, { props: { json, visible: true }, attachTo: document.body })
    await settle(() => expect(debug.find('.druxt-debug__key').exists()).toBe(true))
    expect(debug.classes()).toContain('not-prose')
    expect(debug.findAll('.druxt-debug__key').map((key) => key.text())).toContain('"promote"')
    expect(debug.find('.druxt-debug__literal').text()).toBe('true')
    const folds = () => debug.findAll('.druxt-debug__fold')
    expect(folds().map((fold) => [fold.text(), fold.attributes('aria-expanded')])).toEqual([['+80 chars', 'false'], ['{…} 1 key', 'false']])
    await folds()[0]!.trigger('click')
    await settle()
    expect(debug.find('.druxt-debug__json').text()).toContain(`"${'x'.repeat(120)}"`)
    // The expanded string keeps a button that folds it again, and focus moves to it.
    const again = folds()[0]!
    expect([again.text(), again.attributes('aria-expanded'), again.attributes('aria-label')]).toEqual(['fold', 'true', 'Fold to 40 characters'])
    expect(document.activeElement).toBe(again.element)
    await folds()[1]!.trigger('click')
    await settle()
    const open = folds()[1]!
    expect([open.text(), open.attributes('aria-expanded'), open.attributes('aria-label')]).toEqual(['{', 'true', 'Fold 1 key'])
    expect(document.activeElement).toBe(open.element)
    expect(folds()[2]!.text()).toBe('{…} 1 key')
    await open.trigger('click')
    await settle()
    expect(folds().map((fold) => fold.text())).toEqual(['fold', '{…} 1 key'])
    expect(document.activeElement).toBe(folds()[1]!.element)
  })

  // A key may hold a `/`, so `a/b` and `b` inside `a` are different places.
  it('folds a value under a key with a slash apart from the same path through nested keys', async () => {
    const debug = await mountSuspended(DruxtDebug, { props: { json: { 'a/b': 'x'.repeat(120), 'a': { b: 'y'.repeat(120) } }, visible: true }, attachTo: document.body })
    await settle(() => expect(debug.find('.druxt-debug__key').exists()).toBe(true))
    const folds = () => debug.findAll('.druxt-debug__fold')
    expect(folds().map((fold) => fold.text())).toEqual(['+80 chars', '+80 chars'])
    await folds()[1]!.trigger('click')
    await settle()
    expect(folds().map((fold) => fold.text())).toEqual(['+80 chars', 'fold'])
    expect(document.activeElement).toBe(folds()[1]!.element)
  })
})
