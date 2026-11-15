import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import type { DruxtClientQuery } from '@druxt/client'

/** A list as the comma list JSON:API takes, such as `uid,field_tags`. Anything else is returned as it came. */
const commaList = (value: unknown): unknown => Array.isArray(value) ? value.join(',') : value

/**
 * The params that read `include` and `sort` as a comma list or as a list: the library reads a comma list only, and
 * throws on a list, which a query object may hold and a query string such as `include[]=uid` parses to.
 */
class ListParams extends DrupalJsonApiParams {
  override initializeWithQueryObject(input: Record<string, unknown>): this {
    return super.initializeWithQueryObject({
      ...input,
      ...('include' in input ? { include: commaList(input.include) } : {}),
      ...('sort' in input ? { sort: commaList(input.sort) } : {}),
    })
  }
}

/**
 * A JSON:API query as `DrupalJsonApiParams`, from a query string, a query object or another params object. An
 * `include` or `sort` given as a list reads as its comma list.
 *
 * @param query - The query, or nothing for an empty one.
 *
 * @example @lang ts
 * getDrupalJsonApiParams({ include: ['uid', 'field_tags'] }).getQueryString() // 'include=uid%2Cfield_tags'
 */
export const getDrupalJsonApiParams = (query?: DruxtClientQuery | Record<string, unknown>): DrupalJsonApiParams => {
  return new ListParams().initialize(query as Parameters<DrupalJsonApiParams['initialize']>[0])
}
