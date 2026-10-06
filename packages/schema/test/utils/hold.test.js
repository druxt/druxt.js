/* global globalThis */
import { getHeldSchema, parseSchemaId, clearSchemaHold } from '../../src/utils/hold'

const generation = Symbol.for('druxt.processCacheGeneration')
const clear = () => { globalThis[generation] = { value: ((globalThis[generation] || {}).value || 0) + 1 } }

const generator = (getSchemaById) => {
  const create = jest.fn(() => ({ getSchemaById }))
  return create
}

describe('schema hold', () => {
  beforeEach(() => clearSchemaHold())

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

    expect(await getHeldSchema(create, 'node--page--default--view')).toStrictEqual({ id: 'node--page--default--view' })
    await getHeldSchema(create, 'node--page--default--view')
    expect(getSchemaById).toHaveBeenCalledTimes(1)

    clear()
    await getHeldSchema(create, 'node--page--default--view')
    expect(getSchemaById).toHaveBeenCalledTimes(2)
    expect(create).toHaveBeenCalledTimes(2)
  })

  test('concurrent calls share one generation', async () => {
    let resolve
    const getSchemaById = jest.fn(() => new Promise((r) => { resolve = r }))
    const create = generator(getSchemaById)

    const calls = [getHeldSchema(create, 'node--page--default--view'), getHeldSchema(create, 'node--page--default--view')]
    resolve({ id: 'shared' })
    expect(await Promise.all(calls)).toStrictEqual([{ id: 'shared' }, { id: 'shared' }])
    expect(getSchemaById).toHaveBeenCalledTimes(1)
  })

  test('a schema generated across a clear is returned but not held', async () => {
    let resolve
    const getSchemaById = jest.fn(() => new Promise((r) => { resolve = r }))
    const create = generator(getSchemaById)

    const call = getHeldSchema(create, 'node--page--default--view')
    clear()
    resolve({ id: 'stale' })
    expect(await call).toStrictEqual({ id: 'stale' })

    getSchemaById.mockImplementation(async () => ({ id: 'fresh' }))
    expect(await getHeldSchema(create, 'node--page--default--view')).toStrictEqual({ id: 'fresh' })
  })

  test('a failed or empty generation is not held', async () => {
    const getSchemaById = jest.fn()
      .mockRejectedValueOnce(new Error('Drupal is down'))
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce({ id: 'later' })
    const create = generator(getSchemaById)

    await expect(getHeldSchema(create, 'node--page--default--view')).rejects.toThrow('Drupal is down')
    expect(await getHeldSchema(create, 'node--page--default--view')).toBe(false)
    expect(await getHeldSchema(create, 'node--page--default--view')).toStrictEqual({ id: 'later' })
  })
})
