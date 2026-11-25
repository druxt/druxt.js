// The resources Drupal omitted from a JSON:API document, and the resource types already warned about.
import { resourceOf } from './utils/href'

/**
 * What Drupal omitted from a response.
 *
 * It holds Drupal's reason, and the type and id of each omitted resource. It holds no URL.
 */
export interface DruxtOmitted {
  detail: string
  resources: Array<{ type: string, id?: string }>
}

/**
 * Reads what Drupal omitted from a JSON:API document.
 *
 * The result holds Drupal's reason, and each omitted resource's type and id, read from its link. It leaves out the
 * links themselves, which name the backend.
 *
 * @param document - A JSON:API document.
 * @param endpoint - The JSON:API endpoint's path.
 * @returns What was omitted, or undefined when nothing was.
 *
 * @example @lang js
 * omittedResources(response.data)
 * // { detail: 'Some resources have been omitted because of insufficient authorization.', resources: [{ type: 'user--user', id: '...' }] }
 */
export const omittedResources = (document: unknown, endpoint = '/jsonapi'): DruxtOmitted | undefined => {
  const omitted = (
    document as { meta?: { omitted?: { detail?: unknown, links?: Record<string, { href?: unknown }> } } } | undefined
  )?.meta?.omitted
  if (!omitted || typeof omitted !== 'object') return undefined

  const resources = Object.entries(omitted.links || {})
    .filter(([key, link]) => key !== 'help' && typeof link?.href === 'string')
    .map(([, link]) => resourceOf(link.href as string, endpoint))
    .filter((resource): resource is { type: string, id?: string } => !!resource.type)

  return { detail: typeof omitted.detail === 'string' ? omitted.detail : '', resources }
}

/**
 * The resource types already warned about for omitted resources, keyed by each site's base URL.
 *
 * Every client of a site in the process shares it. So each type is warned about once, until a client of the site
 * runs `clearCache()`.
 */
export const warnedOmitted = new Map<string, Set<string>>()
