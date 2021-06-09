import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

export const getDrupalJsonApiParams = (query) => {
  const apiParams = new DrupalJsonApiParams()
  if (!query) {
    return apiParams
  }

  // Turn query into DrupalJsonApiParams object.
  if (typeof query === 'object') {
    if (typeof query.getQueryObject === 'function') {
      query = query.getQueryObject()
    }

    // Normalize the query object data.
    // @see https://github.com/druxt/druxt.js/issues/73
    for (const attribute of ['include', 'sort']) {
      if (Array.isArray(query[attribute])) {
        query[attribute] = query[attribute].join(',')
      }
    }

    apiParams.initializeWithQueryObject(query)
  } else {
    apiParams.initializeWithQueryString(query)
  }

  return apiParams
}
