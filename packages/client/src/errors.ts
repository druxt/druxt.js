// The errors the client throws, and the shape of the errors it reports.
import type { DruxtError, DruxtResponse } from './types'

/** A failed request, with the response when there was one. */
export interface RequestError extends Error {
  response?: DruxtResponse<unknown>
}

/**
 * Thrown by `checkPermissions()` when Drupal omitted resources for lack of
 * permissions. `response` carries it in a failed request's shape, for `error()`.
 */
export class DruxtPermissionsError extends Error {
  /** The permissions Drupal named. */
  permissions: string[]
  /** Drupal's help on omitted resources, when it sent the link. */
  help?: string
  response: { statusText?: string, data: { errors: { detail: string }[] } }

  /**
   * @param detail - Drupal's explanation of the omission.
   * @param permissions - The permissions Drupal named.
   * @param help - Drupal's help link.
   */
  constructor(detail: string | undefined, permissions: string[], help?: string) {
    const required = [`Required permissions:\n - ${permissions.join('\n - ')}`, help && `See ${help}`].filter(Boolean).join('\n\n')
    super([detail, required].filter(Boolean).join('\n\n'))
    this.name = 'DruxtPermissionsError'
    this.permissions = permissions
    this.help = help
    this.response = { statusText: detail, data: { errors: [{ detail: required }] } }
  }
}

export interface ErrorLike {
  message?: string
  response?: DruxtError['response'] & { url?: string }
}
