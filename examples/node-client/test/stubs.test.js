'use strict'

const { renderStubs, stubs } = require('../src/commands/stubs')
const { clients } = require('./setup')

describe('stubs command', () => {
  test('generates a named wrapper stub with a slot per schema field', async () => {
    const data = await stubs(clients, 'node--recipe', { mode: 'default' })

    expect(data.files).toHaveLength(1)
    const file = data.files[0]
    expect(file.filename).toBe('DruxtEntityNodeRecipeDefault.vue')
    expect(file.contents).toContain("<slot name=\"field_media_image\" />")
    expect(file.contents).toContain("<slot name=\"field_ingredients\" />")
    expect(file.contents).toContain("import { DruxtEntityMixin } from 'druxt-entity'")
    expect(file.contents).toContain("name: 'DruxtEntityNodeRecipeDefault'")
  })

  test('renders file blocks for stdout', async () => {
    const data = await stubs(clients, 'node--recipe', { mode: 'default' })
    const out = renderStubs(data)
    expect(out).toContain('# DruxtEntityNodeRecipeDefault.vue')
    expect(out).toContain('<template>')
  })

  test('throws with available modes when the mode has no view schema', async () => {
    await expect(stubs(clients, 'node--recipe', { mode: 'nope' }))
      .rejects.toThrow("No 'nope' view schema for node--recipe. Available modes:")
  })
})
