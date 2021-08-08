import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient } from 'druxt'
import mockAxios from 'jest-mock-axios'

const druxt = new DruxtClient('https://demo-api.druxtjs.org')

export const getMockCollection = async (resourceType, query) => {
  const collection = await druxt.getCollection(resourceType, query)
  mockAxios.reset()
  return collection
}

export const getMockResource = async (resourceType, query) => {
  const collection = await getMockCollection(resourceType, new DrupalJsonApiParams().initialize(query).addFields(resourceType, []).addPageLimit(1))
  const resource = await druxt.getResource(resourceType, collection.data[0].id, query)
  mockAxios.reset()
  return resource
}
