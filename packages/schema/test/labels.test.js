import { DruxtSchema } from '../src'
import { parseLabelsId } from '../src/utils/hold'

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
  })

  test('anything else is not a labels ID', () => {
    for (const id of ['labels/', 'labels/../es', 'node--page--default--view', 'es', 'labels/es/x']) {
      expect(parseLabelsId(id)).toBe(false)
    }
  })
})
