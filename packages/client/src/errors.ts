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

/**
 * What a sign-in or refresh rejects with when a later sign-in or a sign-out replaced its session while it ran. It
 * stored nothing, and the session that replaced it is kept.
 */
export interface DruxtSupersededError extends Error {
  superseded: true
}

/**
 * Whether a sign-in or refresh rejected because a later sign-in or a sign-out replaced its session while it ran,
 * rather than because it failed.
 *
 * @param error - What the sign-in or refresh rejected with.
 *
 * @example @lang js
 * try {
 *   await this.$druxt.auth.loginWithPassword({ username, password })
 * } catch (error) {
 *   if (!isSuperseded(error)) throw error
 * }
 */
export const isSuperseded = (error: unknown): error is DruxtSupersededError =>
  error instanceof Error && (error as Partial<DruxtSupersededError>).superseded === true

export interface ErrorLike {
  message?: string
  response?: DruxtError['response'] & { url?: string }
}
