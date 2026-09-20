import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient } from 'druxt'
import mockAxios from 'jest-mock-axios'

export const baseUrl = 'https://demo-api.druxtjs.org'

const druxt = new DruxtClient(baseUrl)

// Clear the shared JSON:API index cache.
const resetIndexCache = () => {
  Object.keys(druxt.index || {}).forEach((key) => delete druxt.index[key])
}

export const getMockCollection = async (resourceType, query) => {
  const collection = await druxt.getCollection(resourceType, query)
  mockAxios.reset()
  resetIndexCache()
  return collection
}

export const getMockResource = async (resourceType, query) => {
  const collection = await getMockCollection(resourceType, new DrupalJsonApiParams().initialize(query).addFields(resourceType, []).addPageLimit(1))
  const resource = await druxt.getResource(resourceType, collection.data[0].id, query)
  mockAxios.reset()
  resetIndexCache()
  return resource
}

export const getMockRoute = async (path) => {
  const route = await druxt.axios.get(`/router/translate-path?path=${path}`)
  mockAxios.reset()
  return route
}
