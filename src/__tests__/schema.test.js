// import axios from 'axios'
import { DruxtSchema } from '..'
import { Schema } from '../schema'

jest.mock('axios')

const baseURL = 'https://example.com'
const options = {}

let druxtSchema

describe('Schema', () => {
  beforeEach(async () => {
    druxtSchema = new DruxtSchema(baseURL, options)
  })

  test('generate', async () => {
    const config = {
      entityType: 'node',
      bundle: 'page'
    }

    const schema = new Schema(config, { druxtSchema })
    const result = await schema.generate()

    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('resourceType')

    expect(result.config).toHaveProperty('entityType')
    expect(result.config).toHaveProperty('bundle')
    expect(result.config).toHaveProperty('mode')
    expect(result.config).toHaveProperty('schemaType')

    expect(result.fields[0]).toHaveProperty('id')
    expect(result.fields[0]).toHaveProperty('description')
    expect(result.fields[0]).toHaveProperty('label.text')
    expect(result.fields[0]).toHaveProperty('label.position')
    expect(result.fields[0]).toHaveProperty('required')
    expect(result.fields[0]).toHaveProperty('type')
    expect(result.fields[0]).toHaveProperty('weight')
    expect(result.fields[0]).toHaveProperty('settings.config')
    expect(result.fields[0]).toHaveProperty('settings.display')
    expect(result.fields[0]).toHaveProperty('thirdPartySettings')
  })
})
