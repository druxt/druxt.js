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

/** Several values in one path segment are joined with this. */
export const MULTI = '+'

/**
 * An exposed filter's place in the URL, a param or a query key, and whether
 * it takes several values.
 *
 * @param {object} config - A normalized page config.
 * @param {string} identifier - The exposed filter identifier.
 * @returns {object} `{ param, multiple }` or `{ query, multiple }`.
 */
const place = (config, identifier) => {
  const where = config.filters[identifier] || {}
  const multiple = !!where.multiple
  return where.param
    ? { param: where.param, multiple }
    : { query: where.query || identifier, multiple }
}

/**
 * The names of the pattern's parameters, in order.
 *
 * @param {string} pattern - The route pattern.
 * @returns {string[]} The parameter names.
 */
const paramNames = (pattern) => [...pattern.matchAll(/\/:([A-Za-z0-9_]+)\??/g)].map((m) => m[1])

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
    let raw = at.param ? params[at.param] : query[at.query]
    // A filter in the path reads `all` as absent, the way an argument does,
    // and splits several values on the join character.
    if (at.param && raw === 'all') raw = undefined
    if (at.param && at.multiple && typeof raw === 'string') raw = raw.split(MULTI)
    if (empty(raw)) continue
    const values = mapValue((v) => fromAlias(config, identifier, v), raw)
    filter[identifier] = at.multiple ? [].concat(values) : values
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
      if (!empty(value)) {
        params[at.param] = [].concat(value)
          .map((v) => toAlias(config, identifier, v))
          .join(MULTI)
      }
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
  // An earlier optional segment with no value is written as `all` when a
  // later one has a value, so the later value keeps its place.
  const names = paramNames(pattern)
  const last = names.reduce((found, name, i) => (params[name] === undefined ? found : i), -1)
  names.forEach((name, i) => {
    if (i < last && params[name] === undefined) params[name] = 'all'
  })
  // Optional segments with no value fall away, and a trailing slash with them.
  const path =
    pattern
      .replace(/\/:([A-Za-z0-9_]+)\??/g, (match, name) =>
        params[name] === undefined ? '' : `/${encodeURIComponent(params[name]).replace(/%2B/g, MULTI)}`
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
