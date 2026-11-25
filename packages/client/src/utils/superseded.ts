// The error for work that a later sign-in or a sign-out replaced while it ran.
import type { DruxtSupersededError } from '../errors'

/** Creates the error a sign-in, a refresh or a request rejects with when another session replaced its own. */
export const supersededError = (): DruxtSupersededError => Object.assign(
  new Error('DruxtAuth: a later sign-in or sign-out replaced the session this was for.'),
  { superseded: true as const },
)
