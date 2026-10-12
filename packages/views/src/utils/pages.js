/**
 * A Views page's config with its defaults.
 *
 * @param {string} pattern - The route pattern.
 * @param {object} page - The page config from `druxt.views.pages`.
 * @returns {object} The config with every key present.
 */
export const normalizePage = (pattern, page = {}) => ({
  pattern,
  viewId: page.viewId,
  displayId: page.displayId || 'default',
  arguments: page.arguments || [],
  filters: page.filters || {},
  page: page.page || 'page',
  sort: page.sort || 'sort',
  history: page.history === 'push' ? 'push' : 'replace',
  aliases: page.aliases || {},
})

/**
 * The id for a word in the URL, or the word itself.
 *
 * @param {object} config - A normalized page config.
 * @param {string} name - The argument or filter name.
 * @param {string} word - The value in the URL.
 * @returns {string} The id.
 */
export const fromAlias = (config, name, word) => {
  const map = config.aliases[name] || {}
  return Object.prototype.hasOwnProperty.call(map, word) ? String(map[word]) : word
}

/**
 * The word for an id, or the id itself.
 *
 * @param {object} config - A normalized page config.
 * @param {string} name - The argument or filter name.
 * @param {string} id - The value the view takes.
 * @returns {string} The word for the URL.
 */
export const toAlias = (config, name, id) => {
  const map = config.aliases[name] || {}
  const found = Object.keys(map).find((word) => String(map[word]) === String(id))
  return found === undefined ? String(id) : found
}

const mapValue = (fn, value) => (Array.isArray(value) ? value.map(fn) : fn(value))

/**
 * An exposed filter's place in the URL, a param or a query key.
 *
 * @param {object} config - A normalized page config.
 * @param {string} identifier - The exposed filter identifier.
 * @returns {object} `{ param }` or `{ query }`.
 */
const place = (config, identifier) => {
  const where = config.filters[identifier] || {}
  return where.param ? { param: where.param } : { query: where.query || identifier }
}

const empty = (value) =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)

/**
 * The view's model for a route. A missing optional argument is sent as
 * `all`, the Views exception value, since an argument list cannot have a
 * hole.
 *
 * @param {object} config - A normalized page config.
 * @param {object} route - `{ params, query }`.
 * @returns {{arguments: string[], filter: object, page: ?number, sort: ?string}}
 */
export const routeToModel = (config, route) => {
  const params = route.params || {}
  const query = route.query || {}
  const args = config.arguments.map((name) =>
    empty(params[name]) ? 'all' : fromAlias(config, name, params[name])
  )
  const filter = {}
  for (const identifier of Object.keys(config.filters)) {
    const at = place(config, identifier)
    const raw = at.param ? params[at.param] : query[at.query]
    if (empty(raw)) continue
    filter[identifier] = mapValue((v) => fromAlias(config, identifier, v), raw)
  }
  return {
    arguments: args,
    filter,
    page: parseInt(query[config.page]) || null,
    sort: query[config.sort] || null,
  }
}

/**
 * A router location for a model. Arguments and param filters become params,
 * everything else becomes query, and query keys the page does not own are
 * kept from the current route.
 *
 * @param {object} config - A normalized page config.
 * @param {string} pattern - The route pattern.
 * @param {object} model - The view's model, with `arguments`.
 * @param {object} [route] - The current route, for the keys to keep.
 * @returns {{path: string, query: object}}
 */
export const modelToLocation = (config, pattern, model, route = {}) => {
  const params = {}
  config.arguments.forEach((name, i) => {
    const value = (model.arguments || [])[i]
    if (!empty(value) && value !== 'all') params[name] = toAlias(config, name, value)
  })
  const owned = new Set([config.page, config.sort])
  const query = {}
  for (const identifier of Object.keys(config.filters)) {
    const at = place(config, identifier)
    const value = (model.filter || {})[identifier]
    if (at.param) {
      if (!empty(value)) params[at.param] = toAlias(config, identifier, value)
      continue
    }
    owned.add(at.query)
    if (!empty(value)) query[at.query] = mapValue((v) => toAlias(config, identifier, v), value)
  }
  if (model.page) query[config.page] = String(model.page)
  if (model.sort) query[config.sort] = model.sort
  for (const [key, value] of Object.entries(route.query || {})) {
    if (!owned.has(key) && !(key in query)) query[key] = value
  }
  // Optional segments with no value fall away, and a trailing slash with them.
  const path =
    pattern
      .replace(/\/:([A-Za-z0-9_]+)\??/g, (match, name) =>
        params[name] === undefined ? '' : `/${encodeURIComponent(params[name])}`
      )
      .replace(/\/+$/, '') || '/'
  return { path, query }
}

/**
 * A route name for a pattern.
 *
 * @param {string} pattern - The route pattern.
 * @returns {string} `druxt-views-page-` and the pattern's slug.
 */
export const routeName = (pattern) => {
  const slug = pattern
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return `druxt-views-page-${slug || 'index'}`
}
