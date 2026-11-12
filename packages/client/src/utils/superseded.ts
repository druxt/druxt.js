// The rejection for work a later sign-in or a sign-out made stale while it ran.
import type { DruxtSupersededError } from '../errors'

/** What a sign-in, refresh or request rejects with when a later sign-in or a sign-out replaced its session while it ran. */
export const supersededError = (): DruxtSupersededError => Object.assign(
  new Error('DruxtAuth: a later sign-in or sign-out replaced the session this was for.'),
  { superseded: true as const },
)
