/**
 * The payload builders are the whole contract with GA4: a renamed parameter or
 * a changed event name silently splits a metric in two rather than failing, so
 * the exact shapes are worth pinning.
 */

import {
  copyCodeEvent,
  isReportableTerm,
  languageFromClass,
  normaliseTerm,
  notFoundEvent,
  searchEvent,
  searchSelectEvent,
} from '../../lib/analytics'

describe('normaliseTerm', () => {
  it('lowercases, trims and collapses whitespace so one term is one row', () => {
    expect(normaliseTerm('  Drupal   Router ')).toBe('drupal router')
    expect(normaliseTerm('DRUPAL')).toBe('drupal')
  })

  it('survives nullish input', () => {
    expect(normaliseTerm(undefined)).toBe('')
    expect(normaliseTerm(null)).toBe('')
  })

  it('caps length, because GA4 rejects oversized values', () => {
    expect(normaliseTerm('a'.repeat(500))).toHaveLength(100)
  })
})

describe('isReportableTerm', () => {
  it('rejects the prefixes caught mid-typing', () => {
    expect(isReportableTerm('d')).toBe(false)
    expect(isReportableTerm('dr')).toBe(false)
    expect(isReportableTerm('  ')).toBe(false)
  })

  it('accepts three characters and up', () => {
    expect(isReportableTerm('dru')).toBe(true)
  })
})

describe('searchEvent', () => {
  it('reports a hit as GA4’s own search event, so built-in reporting picks it up', () => {
    expect(searchEvent('Router', 4)).toEqual([
      'search',
      { search_term: 'router', results_count: 4 },
    ])
  })

  it('reports a miss under its own name so it cannot hide inside the total', () => {
    expect(searchEvent('webform', 0)).toEqual([
      'search_no_results',
      { search_term: 'webform', results_count: 0 },
    ])
  })

  it('coerces a missing count rather than sending NaN', () => {
    expect(searchEvent('router', undefined)[1].results_count).toBe(0)
  })
})

describe('searchSelectEvent', () => {
  it('reports a 1-based position, so a consistently-chosen fifth result reads as a ranking problem', () => {
    expect(searchSelectEvent('menu', '/modules/menu', 4)).toEqual([
      'search_select',
      { search_term: 'menu', link_path: '/modules/menu', position: 5 },
    ])
  })
})

describe('languageFromClass', () => {
  it('extracts the highlighter language', () => {
    expect(languageFromClass('language-js hljs')).toBe('js')
    expect(languageFromClass('hljs language-VUE')).toBe('vue')
  })

  it('returns empty for an unlabelled block or nullish class', () => {
    expect(languageFromClass('hljs')).toBe('')
    expect(languageFromClass(undefined)).toBe('')
  })
})

describe('copyCodeEvent', () => {
  it('labels an unlabelled block rather than dropping it, so totals reconcile', () => {
    expect(copyCodeEvent('/how-to/proxy', '')).toEqual([
      'copy_code',
      { page_path: '/how-to/proxy', language: 'unknown' },
    ])
  })

  it('passes the language through', () => {
    expect(copyCodeEvent('/how-to/proxy', 'bash')[1].language).toBe('bash')
  })
})

describe('notFoundEvent', () => {
  it('keeps the referrer, which is what distinguishes a broken link from a stale index entry', () => {
    expect(notFoundEvent('/guide/proxy/', 'https://google.com/')).toEqual([
      'page_not_found',
      { page_path: '/guide/proxy/', referrer: 'https://google.com/' },
    ])
  })

  it('marks a direct hit explicitly, so the row is not an empty string', () => {
    expect(notFoundEvent('/gone', '')[1].referrer).toBe('(none)')
  })
})
