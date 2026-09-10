import { config, createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtMenu, DruxtMenuStore } from '../..'
import DruxtMenuComponent from '../../src/components/DruxtMenu.vue'
import DruxtMenuItemComponent from '../../src/components/DruxtMenuItem.vue'

jest.mock('axios')

const baseUrl = 'https://demo-api.druxtjs.org'

const propsData = {
  item: {
    entity: {
      attributes: {
        title: 'Parent',
        link: { uri: 'internal:/parent' },
        route: { name: 'test' }
      }
    },
    children: [
      {
        entity: {
          attributes: {
            title: 'Child - Internal',
            link: { uri: 'entity:node/1' },
            route: { name: 'test-child' }
          }
        },
        children: []
      },
      {
        entity: {
          attributes: {
            title: 'Child - External',
            link: { uri: 'entity:https://druxtjs.org' },
            route: { name: '' }
          }
        },
        children: []
      },
    ]
  }
}

const stubs = ['nuxt-link']

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const mountComponent = options => {
  config.mocks.$route = {
    path: '/'
  }

  return shallowMount(DruxtMenuItemComponent, {
    localVue,
    propsData,
    parentComponent: DruxtMenuComponent,
    stubs,
    ...options
  })
}

let store

describe('DruxtMenuItem', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()
    store.$druxtMenu = new DruxtMenu(baseUrl, {})
    DruxtMenuStore({ store })
    config.mocks.$store = store
  })

  test('default', () => {
    const wrapper = mountComponent()
    // Ensure we get sane default HTML.
    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.vm.to).toStrictEqual({ path: '/parent' })
  })

  test('unwrapped', () => {
    const wrapper = mountComponent({ parentComponent: null })
    // Ensure unwrapped instance of `<druxt-menu-item />` doesn't render.
    expect(wrapper.html()).toBe('')
  })

  test('external', () => {
    const wrapper = mountComponent({
      propsData: {
        item: {
          entity: {
            attributes: {
              title: 'External',
              url: 'https://druxtjs.org',
              route: { name: '' }
            }
          }
        }
      }
    })

    // Ensure we get sane default HTML.
    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.vm.to).toStrictEqual(false)
  })
})

describe('DruxtMenuItem link resolution', () => {
  // Renders the route it was given, so tests can read it back.
  const NuxtLink = {
    name: 'NuxtLink',
    props: ['to'],
    render(h) {
      return h('a', { attrs: { 'data-to': JSON.stringify(this.to) } }, this.$slots.default)
    }
  }

  const jsonApiMenuItems = { menu: { jsonApiMenuItems: true } }
  const coreJsonApi = { menu: { jsonApiMenuItems: false } }

  // Loads one menu item from the recorded fixtures, through the real source.
  const getEntity = async (options, menuName, title) => {
    const { entities } = await new DruxtMenu(baseUrl, options).get(menuName)
    return entities.find((entity) => entity.attributes.title === title)
  }

  const renderItem = (entity, mocks = {}) => shallowMount(DruxtMenuItemComponent, {
    localVue,
    mocks: { $route: { path: '/' }, ...mocks },
    parentComponent: DruxtMenuComponent,
    propsData: { item: { entity, children: [] } },
    stubs: { 'nuxt-link': NuxtLink },
  })

  // Describes the rendered link element inside the menu item.
  const rendered = (wrapper) => {
    const [element] = wrapper.element.children
    if (element.dataset.to) return { to: JSON.parse(element.dataset.to), text: element.textContent }
    if (element.tagName === 'A') return { href: element.getAttribute('href'), text: element.textContent }
    return { tag: element.tagName.toLowerCase(), text: element.textContent }
  }

  beforeEach(() => {
    store = new Vuex.Store()
    store.$druxtMenu = new DruxtMenu(baseUrl, {})
    DruxtMenuStore({ store })
    config.mocks.$store = store
  })

  test('routes an unrouted internal path through the frontend router', async () => {
    // The cms.druxtjs.org footer links internal:/api, which only the Nuxt
    // frontend serves, so Drupal reports an empty route name.
    const wrapper = renderItem(await getEntity(jsonApiMenuItems, 'footer', 'API reference'))
    expect(rendered(wrapper)).toStrictEqual({ to: { path: '/api' }, text: 'API reference' })
    expect(wrapper.vm.to).toStrictEqual({ path: '/api' })
  })

  test('keeps routed and external links as they were', async () => {
    expect(rendered(renderItem(await getEntity(jsonApiMenuItems, 'footer', 'Tutorials'))))
      .toStrictEqual({ to: { path: '/tutorials' }, text: 'Tutorials' })
    expect(rendered(renderItem(await getEntity(jsonApiMenuItems, 'footer', 'GitHub'))))
      .toStrictEqual({ href: 'https://github.com/druxt/druxt.js', text: 'GitHub' })
  })

  test('renders <nolink> as text', async () => {
    const wrapper = renderItem(await getEntity(jsonApiMenuItems, 'probe', 'Section heading'))
    expect(rendered(wrapper)).toStrictEqual({ tag: 'span', text: 'Section heading' })
    expect(wrapper.vm.to).toBe(false)
  })

  test.each(['<none>', '<button>'])('renders %s as text', (route) => {
    const entity = { attributes: { title: 'Heading', url: '', route: { name: route, parameters: [] } } }
    expect(rendered(renderItem(entity))).toStrictEqual({ tag: 'span', text: 'Heading' })
  })

  test('routes core JSON:API links by resolvable_uri, not the entity URI', async () => {
    expect(rendered(renderItem(await getEntity(coreJsonApi, 'footer', 'Tutorials'))))
      .toStrictEqual({ to: { path: '/tutorials' }, text: 'Tutorials' })
    expect(rendered(renderItem(await getEntity(coreJsonApi, 'footer', 'API reference'))))
      .toStrictEqual({ to: { path: '/api' }, text: 'API reference' })
    expect(rendered(renderItem(await getEntity(coreJsonApi, 'probe', 'GitHub'))))
      .toStrictEqual({ href: 'https://github.com/druxt/druxt.js', text: 'GitHub' })
    expect(rendered(renderItem(await getEntity(coreJsonApi, 'probe', 'Section heading'))))
      .toStrictEqual({ tag: 'span', text: 'Section heading' })
  })

  test('routes an absolute URL on the Drupal host by path', () => {
    const entity = { attributes: { title: 'Tutorials', url: `${baseUrl}/tutorials`, route: { name: '' }, options: { external: true } } }
    const wrapper = renderItem(entity, { $druxt: { settings: { baseUrl } } })
    expect(rendered(wrapper)).toStrictEqual({ to: { path: '/tutorials' }, text: 'Tutorials' })
  })

  test('routes an absolute URL on the frontend host by path, query and hash', () => {
    // jsdom serves the test page from http://localhost.
    const entity = { attributes: { title: 'How-to guides', url: 'http://localhost/how-to?tab=all#top', route: { name: '' } } }
    expect(rendered(renderItem(entity))).toStrictEqual({
      to: { path: '/how-to', query: { tab: 'all' }, hash: '#top' },
      text: 'How-to guides'
    })
  })

  test('keeps Drupal file URLs as plain links', () => {
    const url = `${baseUrl}/sites/default/files/guide.pdf`
    const entity = { attributes: { title: 'Guide', url, route: { name: '' } } }
    const wrapper = renderItem(entity, { $druxt: { settings: { baseUrl } } })
    expect(rendered(wrapper)).toStrictEqual({ href: url, text: 'Guide' })
  })

  test('reads the frontend host from the request during server rendering', () => {
    const { frontendUrl } = DruxtMenuItemComponent.computed
    const request = (headers) => ({ $ssrContext: { req: { headers } } })

    expect(frontendUrl(request({ 'x-forwarded-host': 'www.example.com, proxy.internal', host: 'localhost:3000' })))
      .toBe('//www.example.com')
    expect(frontendUrl(request({ host: 'localhost:3000' }))).toBe('//localhost:3000')
    expect(frontendUrl(request({}))).toBe(undefined)
  })
})
