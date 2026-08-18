'use strict'

const { renderSample, sample } = require('../src/commands/sample')
const { clients } = require('./setup')

describe('sample command', () => {
  test('fetches a page of entities with labels', async () => {
    const data = await sample(clients, 'node--recipe', { limit: 3 })

    expect(data.resourceType).toBe('node--recipe')
    expect(data.count).toBe(3)
    expect(data.entities).toHaveLength(3)
    expect(data.entities.map((o) => o.label)).toEqual([
      'Deep mediterranean quiche',
      'Vegan chocolate and nut brownies',
      'Super easy vegetarian pasta bake',
    ])
    for (const entity of data.entities) {
      expect(entity.id).toMatch(/^[0-9a-f-]{36}$/)
    }
  })

  test('table render includes the uuids and labels', async () => {
    const data = await sample(clients, 'node--recipe', { limit: 3 })
    const out = renderSample(data)
    expect(out).toContain('UUID')
    expect(out).toContain('Deep mediterranean quiche')
    expect(out).toContain('3 of node--recipe (page 1)')
  })
})
