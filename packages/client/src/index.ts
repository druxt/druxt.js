// The client.
export { DruxtClient } from './client'

// Auth: OAuth against Drupal's Simple OAuth.
export {
  DruxtAuth,
  KEYS as AUTH_STORAGE_KEYS,
  createPkce,
  memoryStorage,
} from './auth'
export type { TokenResponse, UserInfo } from './auth'

// Errors, and the resources Drupal omitted from a response.
export { DruxtPermissionsError, isSuperseded } from './errors'
export type { DruxtSupersededError } from './errors'
export { omittedResources } from './omitted'
export type { DruxtOmitted } from './omitted'

// Types: the options, the JSON:API shapes, and requests and responses.
export type * from './types'

// Site config: the module settings, and the client options and connections read from them.
export {
  DRUXT_CLIENT_KEYS,
  clientOptions,
  connectionsFrom,
  mergeDeep,
  resolveDruxtSettings,
} from './settings'
export type { DruxtConfig, DruxtSettings } from './settings'

// URL helpers: slash trimming, and the endpoint's one spelling.
export { normalEndpoint, trimEndSlashes, trimStartSlashes } from './paths'

// The JSON:API index cache.
export { JsonApiIndexCache } from './jsonApiIndex'
export type { FetchedIndex } from './jsonApiIndex'

// The process cache, and how long a response may be cached.
export {
  byteSize,
  forgetProcessCache,
  headersHaveCredentials,
  lifetimeLeft,
  parseCacheLifetime,
  processCacheGeneration,
  rememberLifetime,
  resetProcessCache,
} from './processCache'
export type { ProcessCacheHandle, ProcessCacheHandleOptions } from './processCache'
