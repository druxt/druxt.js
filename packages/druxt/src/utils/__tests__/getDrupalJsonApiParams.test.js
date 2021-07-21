import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { getDrupalJsonApiParams } from '../getDrupalJsonApiParams'

test('getDrupalJsonApiParams', () => {
  // Defaults.
  expect(getDrupalJsonApiParams()).toStrictEqual(expect.any(DrupalJsonApiParams))
  expect(getDrupalJsonApiParams('')).toStrictEqual(expect.any(DrupalJsonApiParams))
  expect(getDrupalJsonApiParams({})).toStrictEqual(expect.any(DrupalJsonApiParams))
  expect(getDrupalJsonApiParams(new DrupalJsonApiParams().getQueryString())).toStrictEqual(expect.any(DrupalJsonApiParams))
  expect(getDrupalJsonApiParams(new DrupalJsonApiParams().getQueryObject())).toStrictEqual(expect.any(DrupalJsonApiParams))

  // Incorrectly normalized query object.
  const badObject = { include: [], sort: [] }
  expect(getDrupalJsonApiParams(badObject)).toStrictEqual(expect.any(DrupalJsonApiParams))
})
