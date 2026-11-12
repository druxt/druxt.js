import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import type { DruxtClientQuery } from '@druxt/client'

export const getDrupalJsonApiParams = (query?: DruxtClientQuery | Record<string, unknown>): DrupalJsonApiParams => {
  return new DrupalJsonApiParams().initialize(query as Parameters<DrupalJsonApiParams['initialize']>[0])
}
