import { describe, expect, it } from 'vitest'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { getDrupalJsonApiParams } from '../../packages/core/src/runtime/utils/getDrupalJsonApiParams'

const params = () => new DrupalJsonApiParams().addFilter('status', '1').addInclude(['uid']).addFields('node--page', ['title'])

describe('getDrupalJsonApiParams()', () => {
  it('gives empty params for no query, an empty string or an empty object', () => {
    for (const query of [undefined, '', {}]) {
      const result = getDrupalJsonApiParams(query)
      expect(result).toBeInstanceOf(DrupalJsonApiParams)
      expect(result.getQueryString()).toBe('')
    }
  })

  it('reads a query string and a query object into the same params', () => {
    const query = params()
    expect(getDrupalJsonApiParams(query.getQueryString()).getQueryString()).toBe(query.getQueryString())
    expect(getDrupalJsonApiParams(query.getQueryObject()).getQueryString()).toBe(query.getQueryString())
    expect(getDrupalJsonApiParams(new DrupalJsonApiParams().getQueryString())).toBeInstanceOf(DrupalJsonApiParams)
    expect(getDrupalJsonApiParams(new DrupalJsonApiParams().getQueryObject())).toBeInstanceOf(DrupalJsonApiParams)
  })

  it('reads a badly normalised query object, with arrays for its include and sort', () => {
    const result = getDrupalJsonApiParams({ include: [], sort: [] })
    expect(result).toBeInstanceOf(DrupalJsonApiParams)
    expect(result.getQueryString()).toBe('')
  })

  it('reads an array include or sort as the comma list Drupal takes, from an object or a query string', () => {
    expect(getDrupalJsonApiParams({ include: ['uid', 'field_tags'] }).getQueryObject()).toMatchObject({ include: 'uid,field_tags' })
    expect(getDrupalJsonApiParams({ sort: ['-created', 'title'] }).getQueryObject()).toMatchObject({ sort: '-created,title' })
    expect(getDrupalJsonApiParams({ include: ['uid'], sort: ['-created'], fields: { 'node--page': 'title' } }).getQueryObject())
      .toMatchObject({ include: 'uid', sort: '-created', fields: { 'node--page': 'title' } })
    expect(getDrupalJsonApiParams('include[]=uid&include[]=field_tags&sort[]=-created').getQueryObject()).toMatchObject({ include: 'uid,field_tags', sort: '-created' })
    expect(getDrupalJsonApiParams('include[0]=uid').getQueryObject()).toMatchObject({ include: 'uid' })
  })

  it('leaves the query it was given as it was', () => {
    const query = { include: ['uid'], sort: ['-created'] }
    getDrupalJsonApiParams(query)
    expect(query).toEqual({ include: ['uid'], sort: ['-created'] })
  })
})
