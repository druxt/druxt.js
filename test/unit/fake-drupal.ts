// cspell:ignore filemime fieldsets (Drupal's file attribute, and JSON:API's sparse fieldsets)
import type { DruxtFetch } from '../../packages/client/src'

export const BASE_URL = 'https://drupal.test'

/** A request the fake Drupal received. */
export interface Call {
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
}

// A URL on the fake Drupal as its path, any other URL whole.
const path = (url: string): string => (url.startsWith(`${BASE_URL}/`) ? url.slice(BASE_URL.length) : url)

type Reply = object | ((call: Call) => Response | Promise<Response>)

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  422: 'Unprocessable Content',
  500: 'Internal Server Error',
}

/**
 * A JSON:API response.
 *
 * @param body - The document.
 * @param status - The status code.
 * @param headers - More response headers.
 */
export const json = (body: unknown, status = 200, headers: Record<string, string> = {}): Response => new Response(JSON.stringify(body), {
  status,
  statusText: STATUS_TEXT[status],
  headers: { 'Content-Type': 'application/vnd.api+json', ...headers },
})

/**
 * Drupal's JSON:API index, its links under a prefix.
 *
 * @param prefix - The language prefix, such as `/es`.
 * @param types - The resource types it lists.
 */
export const index = (prefix = '', types = ['node--article', 'node--page']) => ({
  data: [],
  links: {
    self: { href: `${BASE_URL}${prefix}/jsonapi` },
    ...Object.fromEntries(types.map((type) => [type, { href: `${BASE_URL}${prefix}/jsonapi/${type.replace('--', '/')}` }])),
  },
})

/**
 * A fetch that answers from routes keyed by method and path, with a JSON:API 404 otherwise.
 *
 * @param routes - A document to answer with, or a function building the response.
 */
export const drupal = (routes: Record<string, Reply>) => {
  const calls: Call[] = []
  const fetch: DruxtFetch = async (url, init = {}) => {
    const call: Call = { url, method: init.method || 'GET', headers: { ...init.headers as Record<string, string> }, body: init.body }
    calls.push(call)
    // A function route keyed without a query string answers every query on its path, as `individual()` does.
    const bare = routes[`${call.method} ${path(url).split('?')[0]}`]
    const reply = routes[`${call.method} ${path(url)}`] || (typeof bare === 'function' ? bare : undefined)
    if (!reply) return json({ errors: [{ status: '404', title: 'Not Found', detail: `No route for ${url}.` }] }, 404)
    return typeof reply === 'function' ? reply(call) : json(reply)
  }
  return { fetch, calls }
}

/** The paths requested, with their methods. */
export const requested = (calls: Call[]): string[] => calls.map(({ method, url }) => `${method} ${path(url)}`)

/** A display config entity, as Drupal's JSON:API lists it. */
export const display = (targetEntityType: string, bundle: string, mode: string, status = true) => ({
  type: 'entity_view_display--entity_view_display',
  id: `${targetEntityType}-${bundle}-${mode}`,
  attributes: { targetEntityType, bundle, mode, status, drupal_internal__id: `${targetEntityType}.${bundle}.${mode}`, content: {} },
})

/** A collection of displays, with no further pages. */
export const displays = (schemaType: 'view' | 'form', data: ReturnType<typeof display>[]) => ({
  data: data.map((d) => ({ ...d, type: `entity_${schemaType}_display--entity_${schemaType}_display` })),
  links: { self: { href: `${BASE_URL}/jsonapi/entity_${schemaType}_display/entity_${schemaType}_display` } },
})

/** Decoupled Router's answer for a path, as `router/translate-path` sends it. */
export const translatePath = (data: Record<string, unknown>, status = 200): Reply => () => json(data, status)

const HOME_VIEW_UUID = 'c3b2c1a0-0000-4000-8000-000000000001'

/**
 * The Umami home route: a Views page, the site's front page.
 *
 * As Decoupled Router sends it: `jsonapi.individual` is the view config
 * entity, and the top-level `jsonapi_views` key is the display's results,
 * the URL `viewResults()` answers for.
 */
export const homeRoute = {
  resolved: `${BASE_URL}/en/node`,
  isHomePath: true,
  label: 'Home',
  // pathPrefix and basePath follow the patched Decoupled Router shape on purpose. An unpatched Decoupled Router sends
  // the JSON:API path for both, `pathPrefix: 'jsonapi'` and `basePath: '/jsonapi'`, whatever the route's language.
  jsonapi: { individual: `${BASE_URL}/en/jsonapi/view/view/${HOME_VIEW_UUID}`, resourceName: 'view--view', pathPrefix: 'en', basePath: '/en/jsonapi', entryPoint: `${BASE_URL}/en/jsonapi` },
  view: { view_id: 'frontpage', display_id: 'page_1', uuid: HOME_VIEW_UUID, langcode: 'en' },
  jsonapi_views: `${BASE_URL}/en/jsonapi/views/frontpage/page_1`,
}

/** A recipe node route. */
export const recipeRoute = {
  resolved: `${BASE_URL}/en/recipes/borscht`,
  isHomePath: false,
  label: 'Borscht',
  entity: { canonical: `${BASE_URL}/en/recipes/borscht`, type: 'node', bundle: 'recipe', id: '1', uuid: 'b0b0b0b0-0000-4000-8000-000000000002', langcode: 'en' },
  jsonapi: { individual: `${BASE_URL}/en/jsonapi/node/recipe/b0b0b0b0-0000-4000-8000-000000000002`, resourceName: 'node--recipe', pathPrefix: 'en', basePath: '/en/jsonapi', entryPoint: `${BASE_URL}/en/jsonapi` },
}

/** A second recipe node, for tests that move between entities. */
export const SECOND_RECIPE = 'b0b0b0b0-0000-4000-8000-000000000003'

/** The Spanish recipe node route: the recipe, translated, under the `/es` prefix. */
export const recetaRoute = {
  resolved: `${BASE_URL}/es/recetas/borscht`,
  isHomePath: false,
  label: 'Borscht',
  entity: { canonical: `${BASE_URL}/es/recetas/borscht`, type: 'node', bundle: 'recipe', id: '1', uuid: recipeRoute.entity.uuid, langcode: 'es' },
  jsonapi: { individual: `${BASE_URL}/es/jsonapi/node/recipe/${recipeRoute.entity.uuid}`, resourceName: 'node--recipe', pathPrefix: 'es', basePath: '/es/jsonapi', entryPoint: `${BASE_URL}/es/jsonapi` },
}

/** A page node on a monolingual site: no language prefix, but Drupal still reports the entity's langcode. */
export const pageRoute = {
  resolved: `${BASE_URL}/about`,
  isHomePath: false,
  label: 'About',
  entity: { canonical: `${BASE_URL}/about`, type: 'node', bundle: 'page', id: '4', uuid: 'b0b0b0b0-0000-4000-8000-000000000004', langcode: 'en' },
  jsonapi: { individual: `${BASE_URL}/jsonapi/node/page/b0b0b0b0-0000-4000-8000-000000000004`, resourceName: 'node--page', basePath: '/jsonapi', entryPoint: `${BASE_URL}/jsonapi` },
}

/** A JSON:API resource, as the fake Drupal holds it. */
export interface FakeResource {
  type: string
  id: string
  links?: Record<string, unknown>
  attributes?: Record<string, unknown>
  relationships?: Record<string, { data: { type: string, id: string } | Array<{ type: string, id: string }> | null, links?: Record<string, unknown> }>
}

/** The page node's author. */
export const USER_UUID = 'b0b0b0b0-0000-4000-8000-000000000011'
/** A file, a resource type with no Druxt schema. */
export const FILE_UUID = 'b0b0b0b0-0000-4000-8000-000000000012'
/** The page node the entity tests render. */
export const PAGE_UUID = 'b0b0b0b0-0000-4000-8000-000000000010'

/** The page node's author. */
export const userResource: FakeResource = {
  type: 'user--user',
  id: USER_UUID,
  links: { self: { href: `${BASE_URL}/jsonapi/user/user/${USER_UUID}` } },
  attributes: { display_name: 'Druxt', name: 'druxt', langcode: 'en' },
}

/** A file, a resource type with no Druxt schema. */
export const fileResource: FakeResource = {
  type: 'file--file',
  id: FILE_UUID,
  links: { self: { href: `${BASE_URL}/jsonapi/file/file/${FILE_UUID}` } },
  attributes: { filename: 'druxt.png', filemime: 'image/png', uri: { value: 'public://druxt.png', url: '/sites/default/files/druxt.png' } },
}

/** A page node with a title, a body and an author. */
export const pageNode: FakeResource = {
  type: 'node--page',
  id: PAGE_UUID,
  links: { self: { href: `${BASE_URL}/jsonapi/node/page/${PAGE_UUID}` } },
  attributes: {
    title: 'About Druxt',
    langcode: 'en',
    path: { alias: '/about-druxt', langcode: 'en' },
    body: { value: '<p>Druxt renders Drupal.</p>', format: 'basic_html', processed: '<p>Druxt renders Drupal.</p>', summary: '' },
  },
  relationships: {
    uid: { data: { type: 'user--user', id: USER_UUID }, links: { self: { href: `${BASE_URL}/jsonapi/node/page/${PAGE_UUID}/relationships/uid` } } },
  },
}

/**
 * The page node as Umami's page bundle holds it, its body in `field_body`: the shape the recorded schemas under
 * `test/__fixtures__/schemas` describe. Its stock `body` is empty, as Umami leaves it.
 */
export const umamiPageNode: FakeResource = { ...pageNode, attributes: { ...pageNode.attributes, body: null, field_body: pageNode.attributes!.body } }

/**
 * Drupal's sparse fieldset for a resource: only the fields the request names
 * for its type, and no `relationships` key when none of them is one.
 *
 * @param resource - The resource.
 * @param params - The request's query.
 */
const sparse = (resource: FakeResource, params: URLSearchParams): FakeResource => {
  const named = params.get(`fields[${resource.type}]`)
  if (named === null) return resource
  const fields = named.split(',')
  const pick = <T>(from?: Record<string, T>) => Object.fromEntries(Object.entries(from || {}).filter(([key]) => fields.includes(key)))
  const { relationships, ...rest } = resource
  const attributes = pick(resource.attributes)
  const related = pick(relationships)
  return { ...rest, attributes, ...(Object.keys(related).length ? { relationships: related } : {}) }
}

/**
 * An individual resource route that applies the request's sparse fieldsets
 * and top-level includes, as Drupal does, and links the document to the
 * request's URL. Key it without a query string.
 *
 * @param resource - The resource.
 * @param related - The resources its relationships may include.
 */
export const individual = (resource: FakeResource, related: FakeResource[] = []): Reply => (call) => {
  const params = new URL(call.url).searchParams
  const include = (params.get('include') || '').split(',').filter(Boolean)
  // A path follows each relationship in turn, such as `field_media_image.field_media_image`, as Drupal's does.
  const targets = (from: FakeResource, name: string): FakeResource[] => {
    const data = from.relationships?.[name]?.data
    return (Array.isArray(data) ? data : data ? [data] : [])
      .map((identifier) => related.find((r) => r.type === identifier.type && r.id === identifier.id))
      .filter((r): r is FakeResource => !!r)
  }
  // Each step of a path is included, as Drupal includes the media of `field_media_image.field_media_image` too.
  const found = include.flatMap((path) => {
    let from = [resource]
    return path.split('.').flatMap((name) => (from = from.flatMap((r) => targets(r, name))))
  })
  const included = found.filter((r, i) => found.findIndex((o) => o.type === r.type && o.id === r.id) === i).map((r) => sparse(r, params))
  // The document's own link names the request, query included, as Drupal's does, so a sparse response is stored as
  // partial and the store merges the fields of later requests.
  return json({ data: sparse(resource, params), ...(included.length ? { included } : {}), links: { self: { href: call.url } } })
}

/**
 * A view config entity, as Drupal's JSON:API sends it: two displays, an
 * exposed filter and a pager that lets a request set its page size.
 */
export const viewConfig = (viewId = 'frontpage') => ({
  data: {
    type: 'view--view',
    id: 'c3b2c1a0-0000-4000-8000-000000000001',
    attributes: {
      drupal_internal__id: viewId,
      label: 'Frontpage',
      base_table: 'node_field_data',
      display: {
        default: {
          id: 'default',
          display_plugin: 'default',
          display_options: {
            row: { type: 'entity:node', options: { view_mode: 'teaser' } },
            pager: { type: 'full', options: { items_per_page: 10, expose: { items_per_page: true } } },
            filters: { title: { id: 'title', exposed: true, expose: { identifier: 'title' } } },
          },
        },
        page_1: { id: 'page_1', display_plugin: 'page', display_options: { path: 'node' } },
      },
    },
  },
})

/**
 * Rows for a fields row: the same two articles, each carrying the fields the
 * fields-row display lists, so a row rendered without `@druxt/entity` has a
 * raw value to show.
 *
 * Kept apart from `viewResults()` so the store-seeding assertions there keep
 * reading a row that carries exactly one field.
 *
 * @returns The results document.
 */
export const viewResultsFields = () => ({
  data: [
    { type: 'node--article', id: 'a0a0a0a0-0000-4000-8000-000000000001', attributes: { title: 'First', nid: 1, created: '2026-01-01T00:00:00+00:00' }, links: { self: { href: `${BASE_URL}/en/jsonapi/node/article/a0a0a0a0-0000-4000-8000-000000000001` } } },
    { type: 'node--article', id: 'a0a0a0a0-0000-4000-8000-000000000002', attributes: { title: 'Second', nid: 2, created: '2026-02-02T00:00:00+00:00' }, links: { self: { href: `${BASE_URL}/en/jsonapi/node/article/a0a0a0a0-0000-4000-8000-000000000002` } } },
  ],
  meta: { count: 2 },
  links: { self: { href: `${BASE_URL}/en/jsonapi/views/frontpage/page_1` } },
})

/**
 * A view config entity whose rows are the display's fields, not whole
 * entities, as Umami's recipe collections are.
 *
 * It carries the three order rules the row output has to follow: the fields
 * are in the object order Views stores them in, one of them is `exclude: true`
 * and renders nothing, and one has an empty label where another has a string.
 * The `page_1` display sets no `fields` key at all, so it inherits the
 * `default` display's list, which is the common case for a page display that
 * overrides only its path.
 *
 * @param viewId - The view's machine name.
 * @returns The view config document.
 */
export const viewConfigFields = (viewId = 'frontpage') => ({
  data: {
    type: 'view--view',
    id: 'c3b2c1a0-0000-4000-8000-000000000002',
    attributes: {
      drupal_internal__id: viewId,
      label: 'Frontpage',
      base_table: 'node_field_data',
      display: {
        default: {
          id: 'default',
          display_plugin: 'default',
          display_options: {
            row: { type: 'fields' },
            // Object order is the display's order. `nid` sits between the two
            // rendered fields so a test that ignored `exclude` would show it.
            fields: {
              title: { id: 'title', field: 'title', type: 'string', settings: { link_to_entity: true }, label: 'Title' },
              nid: { id: 'nid', field: 'nid', type: 'number_integer', label: '', exclude: true },
              created: { id: 'created', field: 'created', type: 'timestamp', settings: { date_format: 'medium' }, label: '' },
            },
            pager: { type: 'full', options: { items_per_page: 10 } },
          },
        },
        page_1: { id: 'page_1', display_plugin: 'page', display_options: { path: 'node' } },
      },
    },
  },
})

/** A `jsonapi_views` results document: two rows, one include, and a total. */
export const viewResults = (count = 2) => ({
  // Rows carry a self link, as a jsonapi_views row does: it is what a consumer
  // seeding the Druxt store from the rows reads to know what each row holds.
  data: [
    { type: 'node--article', id: 'a0a0a0a0-0000-4000-8000-000000000001', attributes: { title: 'First' }, links: { self: { href: `${BASE_URL}/en/jsonapi/node/article/a0a0a0a0-0000-4000-8000-000000000001` } } },
    { type: 'node--article', id: 'a0a0a0a0-0000-4000-8000-000000000002', attributes: { title: 'Second' }, links: { self: { href: `${BASE_URL}/en/jsonapi/node/article/a0a0a0a0-0000-4000-8000-000000000002` } } },
  ],
  included: [
    { type: 'user--user', id: 'u0u0u0u0-0000-4000-8000-000000000001', attributes: { display_name: 'Author' }, links: { self: { href: `${BASE_URL}/en/jsonapi/user/user/u0u0u0u0-0000-4000-8000-000000000001` } } },
  ],
  meta: { count },
  links: { self: { href: `${BASE_URL}/en/jsonapi/views/frontpage/page_1` } },
})
