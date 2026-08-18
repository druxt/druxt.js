'use strict'

const { renderSchema, schema } = require('../src/commands/schema')
const { clients } = require('./setup')

describe('schema command', () => {
  test('returns the default view and form schemas for node--recipe', async () => {
    const data = await schema(clients, 'node--recipe', { mode: 'default' })

    expect(data.resourceType).toBe('node--recipe')
    expect(data.mode).toBe('default')
    expect(data.view.id).toBe('node--recipe--default--view')
    expect(data.form.id).toBe('node--recipe--default--form')

    const fieldIds = data.view.fields.map((field) => field.id)
    expect(fieldIds).toContain('field_media_image')
    expect(fieldIds).toContain('field_recipe_instruction')
  })

  test('defaults to the default display mode', async () => {
    const data = await schema(clients, 'node--recipe')
    expect(data.mode).toBe('default')
    expect(data.view).not.toBeNull()
  })

  test('reports available modes when the requested one has no schema', async () => {
    const data = await schema(clients, 'node--recipe', { mode: 'does_not_exist' })
    expect(data.view).toBeNull()
    expect(data.form).toBeNull()
    expect(data.available).toContain('node--recipe--default--view')

    const out = renderSchema(data)
    expect(out).toContain("No does_not_exist schema for node--recipe")
    expect(out).toContain('Available modes:')
  })

  test('renders found schemas as JSON', async () => {
    const data = await schema(clients, 'node--recipe', { mode: 'default' })
    const out = renderSchema(data)
    expect(out).toContain('# node--recipe -- default (view)')
    expect(out).toContain('# node--recipe -- default (form)')
    expect(out).toContain('"id": "node--recipe--default--view"')
  })

  test('rejects malformed resource types', async () => {
    await expect(schema(clients, 'recipe')).rejects.toThrow('Invalid resource type')
  })
})
