/* global globalThis */
import { createHold, parseSchemaId } from '../../src/utils/hold'

const generation = Symbol.for('druxt.processCacheGeneration')
const clear = () => { globalThis[generation] = { value: ((globalThis[generation] || {}).value || 0) + 1 } }

// A hold per generator factory, as the refresh makes one.
const holds = new Map()
const hold = (create) => {
  if (!holds.has(create)) holds.set(create, createHold(create))
  return holds.get(create).get
}

const generator = (getSchemaById) => {
  const create = jest.fn(() => ({ getSchemaById }))
  return create
}

describe('schema hold', () => {
  test('parseSchemaId', () => {
    expect(parseSchemaId('node--page--default--view')).toStrictEqual({ entityType: 'node', bundle: 'page', mode: 'default', schemaType: 'view' })
    expect(parseSchemaId('taxonomy_term--tags--teaser--form')).toStrictEqual({ entityType: 'taxonomy_term', bundle: 'tags', mode: 'teaser', schemaType: 'form' })
    for (const id of ['', 'node--page', 'node--page--default--edit', 'node--page--default--view--x', '../node--page--default--view', 'Node--page--default--view', undefined]) {
      expect(parseSchemaId(id)).toBe(false)
    }
  })

  test('holds a schema until the next clear, with a new generator after it', async () => {
    const getSchemaById = jest.fn(async (id) => ({ id }))
    const create = generator(getSchemaById)

    expect(await hold(create)('node--page--default--view')).toStrictEqual({ id: 'node--page--default--view' })
    await hold(create)('node--page--default--view')
    expect(getSchemaById).toHaveBeenCalledTimes(1)

    clear()
    await hold(create)('node--page--default--view')
    expect(getSchemaById).toHaveBeenCalledTimes(2)
    expect(create).toHaveBeenCalledTimes(2)
  })

  test('concurrent calls share one generation', async () => {
    let resolve
    const getSchemaById = jest.fn(() => new Promise((r) => { resolve = r }))
    const create = generator(getSchemaById)

    const calls = [hold(create)('node--page--default--view'), hold(create)('node--page--default--view')]
    resolve({ id: 'shared' })
    expect(await Promise.all(calls)).toStrictEqual([{ id: 'shared' }, { id: 'shared' }])
    expect(getSchemaById).toHaveBeenCalledTimes(1)
  })

  test('a schema generated across a clear is returned but not held', async () => {
    let resolve
    const getSchemaById = jest.fn(() => new Promise((r) => { resolve = r }))
    const create = generator(getSchemaById)

    const call = hold(create)('node--page--default--view')
    clear()
    resolve({ id: 'stale' })
    expect(await call).toStrictEqual({ id: 'stale' })

    getSchemaById.mockImplementation(async () => ({ id: 'fresh' }))
    expect(await hold(create)('node--page--default--view')).toStrictEqual({ id: 'fresh' })
  })

  test('a failed or empty generation is not held', async () => {
    const getSchemaById = jest.fn()
      .mockRejectedValueOnce(new Error('Drupal is down'))
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce({ id: 'later' })
    const create = generator(getSchemaById)

    await expect(hold(create)('node--page--default--view')).rejects.toThrow('Drupal is down')
    expect(await hold(create)('node--page--default--view')).toBe(false)
    expect(await hold(create)('node--page--default--view')).toStrictEqual({ id: 'later' })
  })

  test('holds for different sites stay apart, and clear() empties one', async () => {
    const siteA = generator(jest.fn(async () => ({ site: 'a' })))
    const siteB = generator(jest.fn(async () => ({ site: 'b' })))
    const a = createHold(siteA)
    const b = createHold(siteB)

    expect(await a.get('node--page--default--view')).toStrictEqual({ site: 'a' })
    expect(await b.get('node--page--default--view')).toStrictEqual({ site: 'b' })

    a.clear()
    await a.get('node--page--default--view')
    await b.get('node--page--default--view')
    expect(siteA).toHaveBeenCalledTimes(2)
    expect(siteB).toHaveBeenCalledTimes(1)
  })
})
