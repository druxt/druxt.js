// An extension for the Decoupled Drupal mock's server, used by `yarn example:mock`.
//
// The mock records each View's results without a query. Druxt asks for them
// with a sparse fieldset, `?fields[node--recipe]=uuid`, which the mock has no
// recording for, so every view on an example rendered empty. A sparse fieldset
// only narrows what Drupal sends, so the recording without it is a superset of
// the right answer, and this answers with that.
//
// A request that pages, filters or sorts is left alone: the recording without
// the query would be the wrong rows, and a 404 says so.
export default {
  name: 'views-without-fields',
  answer: (request, next) => {
    const answered = next()
    if (answered.status !== 404 || request.method !== 'GET' || !request.route.includes('/jsonapi/views/')) {
      return answered
    }

    const params = [...request.url.searchParams.keys()]
    if (!params.length || !params.every((key) => key.startsWith('fields['))) {
      return answered
    }

    const url = new URL(request.url)
    url.search = ''
    return request.drupal.handle('GET', url.toString(), request.headers)
  },
}
