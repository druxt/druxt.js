import { describe, expect, it } from 'vitest'
import { getModuleComponents } from '../../packages/core/src/runtime/candidates'

const sets = [['node--article', 'default'], ['default']]
const names = (lang?: string, registered: string[] = []) =>
  getModuleComponents('DruxtEntity', sets, lang, (name) => registered.includes(name))

describe('wrapper candidate names', () => {
  it('lists the most specific first', () => {
    expect(names().map((c) => c.name)).toEqual(['DruxtEntityNodeArticleDefault', 'DruxtEntityNodeArticle', 'DruxtEntityDefault'])
  })

  it('adds a langcode variant of each name ahead of it', () => {
    expect(names('en').map((c) => c.name)).toEqual([
      'DruxtEntityNodeArticleDefaultEn',
      'DruxtEntityNodeArticleEn',
      'DruxtEntityNodeArticleDefault',
      'DruxtEntityDefaultEn',
      'DruxtEntityNodeArticle',
      'DruxtEntityDefault',
    ])
  })

  it('marks the registered names', () => {
    expect(names(undefined, ['DruxtEntityDefault']).filter((c) => c.global).map((c) => c.name)).toEqual(['DruxtEntityDefault'])
  })

  it('skips empty parts and lists a name once', () => {
    const candidates = getModuleComponents('DruxtMenu', [['main', null, false, undefined], ['main']], undefined, () => false)
    expect(candidates.map((c) => c.name)).toEqual(['DruxtMenuMain'])
  })

  it('has no candidates without option sets', () => {
    expect(getModuleComponents('DruxtEntity', [], 'en', () => true)).toEqual([])
  })
})
