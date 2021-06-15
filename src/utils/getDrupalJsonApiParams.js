import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

export const getDrupalJsonApiParams = (query) => {
  return new DrupalJsonApiParams().initialize(query);
}
