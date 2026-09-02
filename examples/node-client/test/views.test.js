'use strict'

const { renderViews, views } = require('../src/commands/views')
const { clients } = require('./setup')

describe('views command', () => {
  let data

  beforeAll(async () => {
    data = await views(clients)
  })

  test('lists the backend views with their displays', () => {
    expect(data.count).toBe(data.views.length)
    expect(data.count).toBeGreaterThan(15)

    const ids = data.views.map((o) => o.id)
    expect(ids).toContain('recipes')
    expect(ids).toContain('frontpage')
    expect(ids).toContain('articles_aside')

    const recipes = data.views.find((o) => o.id === 'recipes')
    expect(recipes.label).toBe('Recipes')
    expect(recipes.displays).toContain('page_1')
  })

  test('table render includes view ids and displays', () => {
    const out = renderViews(data)
    expect(out).toContain('VIEW')
    expect(out).toContain('recipes')
    expect(out).toMatch(/displays: .*page_1/)
    expect(out).toMatch(/\d+ views/)
  })
})
