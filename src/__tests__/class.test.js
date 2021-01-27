import mockAxios from 'jest-mock-axios'
import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtClass } from '..'

const baseUrl = 'https://demo-api.druxtjs.org'

const testArticle = { type: 'node--article', id: '98f36405-e1c4-4d8a-a9f9-4d4f6d414e96' }
const testPage = { type: 'node--page', id: '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9' }

// Setup local vue instance.
const localVue = createLocalVue()

const componentOptions = [
  ['one', 'two', 'three'],
  ['one', 'three']
]

// Mock Druxt module.
const DruxtTestModule = {
  render: () => ({}),
  druxt: () => ({
    componentOptions,
    propsData: {}
  })
}

// Mock Druxt module wrapper.
const DruxtTestModuleOneTwoThree = { render: () => ({}) }

jest.mock('axios')

let druxt

const mountWrapper = () => {
  return mount(DruxtTestModule, {
    localVue,
    mocks: { $druxt: new DruxtClass(baseUrl) },
    stubs: { DruxtTestModuleOneTwoThree }
  })
}

describe('DruxtJS Class', () => {
  beforeEach(() => {
    mockAxios.reset()
    druxt = new DruxtClass(baseUrl)
  })

  test('constructor', () => {
    // Throw error if 'baseUrl' not provided.
    expect(() => { return new DruxtClass() }).toThrow('The \'baseUrl\' parameter is required.')

    // Ensure class type.
    expect(new DruxtClass(baseUrl)).toBeInstanceOf(DruxtClass)

    expect(mockAxios.create).toHaveBeenCalledWith({ baseURL: baseUrl })
  })

  test('constructor - axiosSettings', () => {
    const headers = { 'X-Druxt': true }
    const mock = new DruxtClass(baseUrl, {
      axios: { headers }
    })
    expect(mock).toBeInstanceOf(DruxtClass)

    expect(mockAxios.create).toHaveBeenCalledWith({ baseURL: baseUrl, headers })
  })

  test('addHeaders', () => {
    expect(druxt.addHeaders()).toBe(false)

    druxt.addHeaders({ 'X-Druxt': true })
    expect(druxt.axios.defaults.headers.common['X-Druxt']).toBe(true)
  })

  test('buildQueryUrl', () => {
    expect(druxt.buildQueryUrl('url', 'query')).toBe('url?query')
    expect(druxt.buildQueryUrl('url', '?query')).toBe('url?query')
    expect(druxt.buildQueryUrl('url', { getQueryString: () => 'query' })).toBe('url?query')
    expect(druxt.buildQueryUrl('url', { query: 'string' })).toBe('url?query=string')

    expect(druxt.buildQueryUrl('url', {})).toBe('url')
    expect(druxt.buildQueryUrl('url', [])).toBe('url')
    expect(druxt.buildQueryUrl('url', Boolean)).toBe('url')
    expect(druxt.buildQueryUrl('url')).toBe('url')
  })

  test('checkPermissions', () => {
    const res = {
      data: {
        meta: {
          omitted: {
            detail: 'Some resources have been omitted because of insufficient authorization.',
            links: {
              help: null,
              item: {
                meta: {
                  detail: 'The current user is not allowed to GET the selected resource. The \'administer node fields\' permission is required.'
                }
              }
            }
          }
        }
      }
    }
    expect(() => druxt.checkPermissions(res)).toThrow('Some resources have been omitted because of insufficient authorization.\n\n Required permissions: administer node fields.')
  })

  test('getComponents', () => {
    const wrapper = mountWrapper()
    let components

    // Get global matches, expect no results.
    expect(druxt.getComponents(wrapper.vm, componentOptions).length).toBe(0)

    // Get all matches, expect 4 results.
    components = druxt.getComponents(wrapper.vm, componentOptions, true)
    expect(components.length).toBe(4)
    expect(components[0].pascal).toBe('OneTwoThree')
    expect(components[1].pascal).toBe('OneTwo')
    expect(components[2].pascal).toBe('OneThree')
    expect(components[3].pascal).toBe('One')

    // Get all matches with custom prefix, expect 4 results.
    components = druxt.getComponents(wrapper.vm, componentOptions, true, 'custom-prefix')
    expect(components.length).toBe(4)
    expect(components[0].prefix).toBe('custom-prefix')
    expect(components[0].pascal).toBe('CustomPrefixOneTwoThree')

    // Get global matches with module name prefix, expect 1 result.
    wrapper.vm.$options.name = 'DruxtTestModule'
    components = druxt.getComponents(wrapper.vm, componentOptions)
    expect(components.length).toBe(1)
    expect(components[0]).toStrictEqual({
      global: true,
      kebab: 'druxt-test-module-one-two-three',
      parts: ['one', 'two', 'three'],
      pascal: 'DruxtTestModuleOneTwoThree',
      prefix: 'druxt-test-module'
    })
  })

  test('getIndex', async () => {
    const index = await druxt.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi')

    expect(Object.keys(index).length).toBe(54)
    expect(index[Object.keys(index)[0]]).toHaveProperty('href')

    const cachedIndex = await druxt.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)

    expect(Object.keys(cachedIndex).length).toBe(54)
  })

  test('getIndex - resource', async () => {
    const resourceIndex = await druxt.getIndex('node--page')
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi')

    expect(resourceIndex).toHaveProperty('href')

    const cachedResourceIndex = await druxt.getIndex('node--page')
    expect(mockAxios.get).toHaveBeenCalledTimes(2)

    expect(cachedResourceIndex).toHaveProperty('href')
  })

  test('getModuleData', async () => {
    // Invoke with no vm.
    expect(await druxt.getModuleData()).toBe(false)

    // Invoke with vm.
    const wrapper = mountWrapper()
    expect(await druxt.getModuleData(wrapper.vm)).toStrictEqual({
      componentOptions: [
        ['one', 'two', 'three'],
        ['one', 'three']
      ],
      propsData: {}
    })

    // Invoke with vm name set.
    wrapper.vm.$options.name = 'DruxtTestModule'
    const moduleData = await druxt.getModuleData(wrapper.vm)
    expect(moduleData.name).toBe('druxt-test-module')
  })

  test('getResource', async () => {
    const entity = await druxt.getResource(testArticle)
    expect(entity.data).toHaveProperty('type', testArticle.type)

    const error = await druxt.getResource({ id: 'test', type: 'missing' })
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi/missing/test')
    expect(error).toBe(false)

    const empty = await druxt.getResource()
    expect(empty).toBe(false)
  })

  test('getCollection', async () => {
    const collection = await druxt.getCollection('node--page')
    expect(mockAxios.get).toHaveBeenLastCalledWith('/jsonapi/node/page')
    expect(collection.data.length).toBe(1)

    await druxt.getCollection('node--page', { 'filter[status]': 1 })
    expect(mockAxios.get).toHaveBeenLastCalledWith('/jsonapi/node/page?filter%5Bstatus%5D=1')

    const noResource = await druxt.getCollection()
    expect(noResource).toBe(false)

    await druxt.getCollection('test--all', null, { all: true })
    expect(mockAxios.get).toHaveBeenLastCalledWith('/jsonapi/test/all?next')
  })
})
