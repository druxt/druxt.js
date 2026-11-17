import { DRUXT_API_BASE, trimEndSlashes } from '../routes'

/** Whether `path` is `base` or a path below it, segment by segment. */
const within = (path: string, base: string): boolean => {
  const trim = (value: string) => trimEndSlashes(value) || '/'
  const [inner, outer] = [trim(path), trim(base)]
  return inner === outer || inner.startsWith(`${outer === '/' ? '' : outer}/`)
}

/**
 * Says why the site's Drupal paths clash with Druxt's own routes, under {@link DRUXT_API_BASE}.
 *
 * There are two clashes:
 *
 * - A JSON:API endpoint, under a language's prefix or none, is at or below the base path.
 * - The base path is at or below a proxied files directory, or the directory is at or below the base path.
 *
 * A JSON:API endpoint above the base path, such as `/api`, is not a clash, because Druxt's routes answer before the
 * proxy.
 *
 * @param paths - The JSON:API endpoint under each language prefix, and the proxied files directories, without `/**`.
 * @param paths.endpoints - The JSON:API endpoint, with and without each language's prefix, such as `/es/jsonapi`.
 * @param paths.files - The files directories the proxy serves, such as `/sites/default/files`.
 * @returns The build error's message, with its code, or undefined when nothing clashes.
 */
export const druxtApiConflict = (paths: { endpoints: string[], files?: string[] }): string | undefined => {
  const endpoint = paths.endpoints.find((path) => within(path, DRUXT_API_BASE))
  if (endpoint) {
    return `DRUXT_E01006: Drupal's JSON:API is at ${endpoint}, which is at or under ${DRUXT_API_BASE}, where Druxt's own server routes are, so the two cannot share it. Set druxt.endpoint to the path Drupal serves JSON:API at, such as /jsonapi or /api, outside ${DRUXT_API_BASE}.`
  }
  const files = (paths.files || []).find((path) => within(DRUXT_API_BASE, path) || within(path, DRUXT_API_BASE))
  if (files) {
    return `DRUXT_E01006: druxt.proxy.files serves ${files}, which overlaps ${DRUXT_API_BASE}, where Druxt's own server routes are, so the proxy would answer for them. Name the site directory Drupal serves its files from in druxt.proxy.files.`
  }
  return undefined
}
