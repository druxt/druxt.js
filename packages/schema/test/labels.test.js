import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { getLanguages } from 'druxt'
import { DruxtSchema } from '../src'
import { parseLabelsId } from '../src/utils/hold'

// The languages Drupal has, for a site whose prefixes aren't in the options. The rest of druxt is real.
jest.mock('druxt', () => ({ ...jest.requireActual('druxt'), getLanguages: jest.fn() }))

const baseUrl = 'https://example.com'

// Field config as Drupal serves it under each URL prefix, with config translations applied.
const fieldConfig = (labels) => [{
  data: Object.entries(labels).map(([id, [label, description]]) => {
    const [entity_type, bundle, field_name] = id.split('.')
    return { type: 'field_config--field_config', attributes: { entity_type, bundle, field_name, label, description } }
  }),
}]

const site = ({ prefixes, byPrefix, resourceFields = {} }) => {
  const schema = new DruxtSchema(baseUrl, { prefixes })
  const reads = []
  schema.druxt.getCollectionAll = jest.fn(async (type, query, langcode) => {
    const prefix = schema.druxt.urlPrefix(langcode)
    reads.push(prefix)
    if (!(prefix in byPrefix)) throw new Error(`404 at /${prefix}`)
    return fieldConfig(byPrefix[prefix])
  })
  schema.druxt.getIndex = jest.fn(async () => ({
    'node--recipe': { resourceFields },
  }))
  return { schema, reads }
}

const english = {
  'node.recipe.field_preparation_time': ['Preparation time', 'Minutes to prepare'],
  'node.recipe.field_difficulty': ['Difficulty', null],
}

describe('DruxtSchema.getLabels', () => {
  test('gives the labels a language translates, by resource type and field', async () => {
    const { schema } = site({
      prefixes: { en: '', es: 'es' },
      byPrefix: {
        '': english,
        es: {
          'node.recipe.field_preparation_time': ['Tiempo de preparación', 'Minutes to prepare'],
          'node.recipe.field_difficulty': ['Difficulty', null],
        },
      },
    })

    expect(await schema.getLabels('es')).toStrictEqual({
      'node--recipe': {
        field_preparation_time: { label: 'Tiempo de preparación', description: 'Minutes to prepare' },
      },
    })
  })

  test('reads under the language URL prefix, which needn\'t be its langcode', async () => {
    const { schema, reads } = site({
      prefixes: { en: '', es: 'spanish' },
      byPrefix: { '': english, spanish: { 'node.recipe.field_difficulty': ['Dificultad', 'Qué tan difícil'] } },
    })

    expect(await schema.getLabels('es')).toStrictEqual({
      'node--recipe': { field_difficulty: { label: 'Dificultad', description: 'Qué tan difícil' } },
    })
    expect(reads.sort()).toStrictEqual(['', 'spanish'])
  })

  test('keys a field by its public name, as the schema does', async () => {
    const { schema } = site({
      prefixes: { en: '', es: 'es' },
      byPrefix: { '': english, es: { 'node.recipe.field_difficulty': ['Dificultad', null] } },
      resourceFields: { field_difficulty: { publicName: 'difficulty' } },
    })

    expect(await schema.getLabels('es')).toStrictEqual({
      'node--recipe': { difficulty: { label: 'Dificultad', description: null } },
    })
  })

  test('nothing for a language served without a prefix, the default language', async () => {
    const { schema, reads } = site({ prefixes: { en: '', es: 'es' }, byPrefix: { '': english } })

    expect(await schema.getLabels('en')).toStrictEqual({})
    expect(reads).toStrictEqual([])
  })

  test('nothing for a language whose labels match the default language', async () => {
    const { schema } = site({ prefixes: { en: 'en', es: 'es' }, byPrefix: { '': english, en: english } })

    expect(await schema.getLabels('en')).toStrictEqual({})
  })

  test('false for a langcode the site does not have, without asking Drupal', async () => {
    const { schema, reads } = site({ prefixes: { en: '', es: 'es' }, byPrefix: { '': english } })

    expect(await schema.getLabels('fr')).toBe(false)
    expect(reads).toStrictEqual([])
  })

  test('reads field config by entity type and bundle when a page after the first fails', async () => {
    const config = {
      prefixes: { en: '', es: 'es' },
      byPrefix: { '': english, es: { 'node.recipe.field_difficulty': ['Dificultad', null] } },
    }
    const expected = await site(config).schema.getLabels('es')

    // Drupal Canvas 1.12.0 answers 500 to any page of a config collection after the first.
    const { schema } = site(config)
    const read = schema.druxt.getCollectionAll
    const filters = (query) => decodeURIComponent(new DrupalJsonApiParams().initialize(query).getQueryString())
    const first = jest.fn(async () => ({ data: [], links: { next: { href: `${baseUrl}/jsonapi/field_config/field_config?page[offset]=50` } } }))
    schema.druxt.getCollection = first
    schema.druxt.getCollectionAll = jest.fn(async (type, query, langcode) => {
      if (!filters(query).includes('filter[bundle]=recipe')) throw Object.assign(new Error('500: Internal Server Error'), { response: { status: 500 } })
      return read(type, query, langcode)
    })

    expect(await schema.getLabels('es')).toStrictEqual(expected)
    expect(first.mock.calls.some(([, query]) => filters(query).includes('filter[entity_type]=node'))).toBe(true)
  })

  test('getAllLabels gives each language\'s labels by langcode', async () => {
    const { schema } = site({
      prefixes: { en: '', es: 'es' },
      byPrefix: { '': english, es: { 'node.recipe.field_difficulty': ['Dificultad', null] } },
    })

    expect(await schema.getAllLabels()).toStrictEqual({
      en: {},
      es: { 'node--recipe': { field_difficulty: { label: 'Dificultad', description: null } } },
    })
  })

  test('without the prefixes option, the prefixes are read from Drupal once, for the build', async () => {
    const { schema } = site({ byPrefix: { '': english, es: { 'node.recipe.field_difficulty': ['Dificultad', null] } } })
    getLanguages.mockResolvedValue([
      { langcode: 'en', prefix: '', default: true },
      { langcode: 'es', prefix: 'es' },
    ])
    const build = {}

    expect(await schema.getAllLabels({ build })).toStrictEqual({
      en: {},
      es: { 'node--recipe': { field_difficulty: { label: 'Dificultad', description: null } } },
    })
    expect(schema.druxt.options.prefixes).toStrictEqual({ en: '', es: 'es' })
    expect(getLanguages).toHaveBeenCalledTimes(1)
    expect(getLanguages).toHaveBeenCalledWith(schema.druxt, { endpoint: '/jsonapi', build })
  })

  test('languages that could not be read are asked for again, rather than kept as none', async () => {
    const { schema } = site({ byPrefix: { '': english, es: { 'node.recipe.field_difficulty': ['Dificultad', null] } } })
    // An unreachable Drupal reads as an empty list, as a site with one language does.
    getLanguages.mockReset()
    getLanguages.mockResolvedValueOnce([])
    expect(await schema.getLabels('es')).toBe(false)
    expect(schema.druxt.options.prefixes).toBe(undefined)

    getLanguages.mockResolvedValue([
      { langcode: 'en', prefix: '', default: true },
      { langcode: 'es', prefix: 'es' },
    ])
    expect(await schema.getLabels('es')).toStrictEqual({
      'node--recipe': { field_difficulty: { label: 'Dificultad', description: null } },
    })
    expect(getLanguages).toHaveBeenCalledTimes(2)
  })

  test('getSchemaById gives the labels for a labels ID', async () => {
    const { schema } = site({
      prefixes: { en: '', es: 'es' },
      byPrefix: { '': english, es: { 'node.recipe.field_difficulty': ['Dificultad', null] } },
    })

    expect(await schema.getSchemaById('labels/es')).toStrictEqual({
      'node--recipe': { field_difficulty: { label: 'Dificultad', description: null } },
    })
  })
})

describe('parseLabelsId', () => {
  test('a labels ID gives its langcode', () => {
    expect(parseLabelsId('labels/es')).toBe('es')
    expect(parseLabelsId('labels/pt-br')).toBe('pt-br')
    // Drupal takes one to eight letters, then hyphenated parts of one to eight letters or digits.
    expect(parseLabelsId('labels/x-demo')).toBe('x-demo')
    expect(parseLabelsId('labels/zh-hans')).toBe('zh-hans')
  })

  test('anything else is not a labels ID', () => {
    for (const id of ['labels/', 'labels/../es', 'node--page--default--view', 'es', 'labels/es/x', 'labels/abcdefghi', 'labels/es-abcdefghi', 'labels/es-']) {
      expect(parseLabelsId(id)).toBe(false)
    }
  })
})
