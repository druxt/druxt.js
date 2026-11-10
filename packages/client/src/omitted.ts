// The resources Drupal omitted from a JSON:API document, and the types already warned about.
import { resourceOf } from './utils/href'

/** What Drupal omitted from a response: its reason, and the type and id of each omitted resource, with no URL. */
export interface DruxtOmitted {
  detail: string
  resources: Array<{ type: string, id?: string }>
}

/**
 * What Drupal omitted from a JSON:API document, without the links that name the backend: its reason, and each omitted
 * resource's type and id, read from its link. Undefined when it omitted nothing.
 *
 * @param document - A JSON:API document.
 * @param endpoint - The JSON:API endpoint's path.
 *
 * @example @lang js
 * omittedResources(response.data)
 * // { detail: 'Some resources have been omitted because of insufficient authorization.', resources: [{ type: 'user--user', id: '...' }] }
 */
export const omittedResources = (document: unknown, endpoint = '/jsonapi'): DruxtOmitted | undefined => {
  const omitted = (document as { meta?: { omitted?: { detail?: unknown, links?: Record<string, { href?: unknown }> } } } | undefined)?.meta?.omitted
  if (!omitted || typeof omitted !== 'object') return undefined
  const resources = Object.entries(omitted.links || {})
    .filter(([key, link]) => key !== 'help' && typeof link?.href === 'string')
    .map(([, link]) => resourceOf(link.href as string, endpoint))
    .filter((resource): resource is { type: string, id?: string } => !!resource.type)
  return { detail: typeof omitted.detail === 'string' ? omitted.detail : '', resources }
}

/**
 * The resource types warned about for omitted resources, per site's base URL, for every client of the site in the
 * process: one warning each until a client of the site runs `clearCache()`.
 */
export const warnedOmitted = new Map<string, Set<string>>()
