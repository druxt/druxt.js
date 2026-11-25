/** The Drupal backend the standalone tests run against, from DRUXT_BASE_URL, without a trailing slash. */
export const BASE_URL: string = (process.env.DRUXT_BASE_URL || 'http://127.0.0.1:8888').replace(/\/+$/, '')
