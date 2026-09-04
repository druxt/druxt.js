/**
 * Event payload builders for the docs site's GA4 instrumentation.
 *
 * Kept pure and separate from the dispatcher so the payloads can be asserted
 * directly. Every builder returns `[eventName, params]`, ready to spread into
 * `$track`.
 *
 * The event set is deliberately small. Each one answers a question the docs
 * team actually has, and nothing here is collected because it was easy:
 *
 * - `search` / `search_no_results` - what readers look for, and what they look
 *   for and do not find. The second is the highest-value signal the site can
 *   produce: it is a content backlog written by the audience.
 * - `search_select` - whether search answered, and which result won.
 * - `copy_code` - which snippets are actually used, as opposed to scrolled past.
 * - `page_not_found` - broken inbound links, with the referrer that sent them.
 */

/** GA4 rejects oversized values, and a long query is a typo, not a search. */
const MAX_TERM = 100

/**
 * Normalise a search term for aggregation.
 *
 * Lowercased and whitespace-collapsed so "Drupal ", "drupal" and "DRUPAL"
 * report as one row rather than three.
 *
 * @param {string} query - Raw query as typed.
 * @returns {string} The normalised term.
 */
export const normaliseTerm = (query) => String(query || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .slice(0, MAX_TERM)

/**
 * Whether a query is worth reporting.
 *
 * Two characters and under are almost always a prefix caught mid-typing, and
 * reporting them buries the real terms under "d", "dr", "dru".
 *
 * @param {string} query - Raw query as typed.
 * @returns {boolean} True when the term should be sent.
 */
export const isReportableTerm = (query) => normaliseTerm(query).length >= 3

/**
 * Build the search event.
 *
 * Uses GA4's own `search` event name and `search_term` parameter rather than a
 * custom pair, so the built-in site-search reporting picks it up without a
 * custom dimension. A zero-result search reports as `search_no_results`
 * instead: same shape, but it earns its own row in every report rather than
 * hiding inside the `search` total.
 *
 * @param {string} query - Raw query as typed.
 * @param {number} resultsCount - Number of results the query returned.
 * @returns {Array} A two-element `[eventName, params]` pair.
 */
export const searchEvent = (query, resultsCount) => [
  resultsCount > 0 ? 'search' : 'search_no_results',
  { search_term: normaliseTerm(query), results_count: Number(resultsCount) || 0 },
]

/**
 * Build the search-result selection event.
 *
 * `position` is 1-based and counts across the flattened result list, so a
 * consistently-chosen fifth result is visible as a ranking problem.
 *
 * @param {string} query - Raw query as typed.
 * @param {string} path - Path of the chosen result.
 * @param {number} index - Zero-based index in the flattened result list.
 * @returns {Array} A two-element `[eventName, params]` pair.
 */
export const searchSelectEvent = (query, path, index) => ['search_select', {
  search_term: normaliseTerm(query),
  link_path: path,
  position: Number(index) + 1,
}]

/**
 * Build the code-copy event.
 *
 * The language comes from the highlighter's `language-*` class when present.
 * Unlabelled blocks report `unknown` rather than being dropped, so the total
 * still reconciles against the page's block count.
 *
 * @param {string} pagePath - Path of the page holding the block.
 * @param {string} language - Fenced-block language, or a falsy value.
 * @returns {Array} A two-element `[eventName, params]` pair.
 */
export const copyCodeEvent = (pagePath, language) => ['copy_code', {
  page_path: pagePath,
  language: language || 'unknown',
}]

/**
 * Extract the fenced-block language from a `<pre>`'s class list.
 *
 * @param {string} className - The element's className.
 * @returns {string} The language, or an empty string when absent.
 */
export const languageFromClass = (className) => {
  const match = /(?:^|\s)language-([a-z0-9+#-]+)/i.exec(String(className || ''))
  return match ? match[1].toLowerCase() : ''
}

/**
 * Build the 404 event.
 *
 * The referrer is the load-bearing half: a 404 on its own says a URL is dead,
 * while the referrer says whether that is a broken internal link, a stale
 * external one, or a search engine holding an index entry that should have
 * been redirected.
 *
 * @param {string} pagePath - The path that was not found.
 * @param {string} referrer - document.referrer, or an empty string.
 * @returns {Array} A two-element `[eventName, params]` pair.
 */
export const notFoundEvent = (pagePath, referrer) => ['page_not_found', {
  page_path: pagePath,
  referrer: referrer || '(none)',
}]
