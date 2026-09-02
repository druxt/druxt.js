'use strict'

const { renderTypes, types } = require('../src/commands/types')
const { clients } = require('./setup')

describe('types command', () => {
  let data

  beforeAll(async () => {
    data = await types(clients)
  })

  test('lists resource types from the JSON:API index', () => {
    expect(data.length).toBeGreaterThan(40)
    const names = data.map((o) => o.type)
    expect(names).toContain('node--recipe')
    expect(names).toContain('node--article')
    expect(names).toContain('file--file')
  })

  test('entries carry an endpoint and are sorted', () => {
    for (const entry of data) {
      expect(entry.href).toEqual(expect.stringContaining('jsonapi'))
    }
    const names = data.map((o) => o.type)
    expect(names).toEqual([...names].sort())
  })

  test('table render includes header, entries and count', () => {
    const out = renderTypes(data)
    expect(out).toContain('RESOURCE TYPE')
    expect(out).toContain('node--recipe')
    expect(out).toMatch(/\d+ resource types/)
  })
})
