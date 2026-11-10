// The content cache's stored responses, the options that may use it, and a response body read as JSON or text.
import type { DruxtReadOptions, DruxtRequestOptions } from '../types'

// The size a process cache scope keeps per consumer when `cache.maxSize` is not set: 50 MB of stored JSON.
export const DEFAULT_MAX_SIZE = 50 * 1024 * 1024

// Request options that never change the response, so a request with only these may use the content cache.
export const CACHE_SAFE_OPTIONS = new Set(['validateStatus', 'bypassCache'])

/** A response kept in the content cache: the document as text, so no caller can change what the next one reads. */
export interface StoredResponse {
  body: string
  status: number
  statusText: string
  headers: Record<string, string>
  seconds: number
  at: number
  started: number
}

/** The `get()` options a resource read needs: the bypass when asked, and none otherwise. */
export const readOptions = (options?: DruxtReadOptions): DruxtRequestOptions | undefined => (options?.bypassCache ? { bypassCache: true } : undefined)

// A body that is not JSON stays text, as Axios left it.
export const parse = (text: string): unknown => {
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
