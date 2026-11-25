import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { DruxtPublicAuthOptions, UserInfo } from '@druxt/client'
import { navigateTo, reloadNuxtApp, useNuxtApp, useRouter, useState } from '#imports'
import { useDruxtStore } from './store'
import { sitePath } from './utils/site-path'

/** The session storage key that holds a sign-in's state, verifier and redirect while the visitor is at Drupal. */
const STATE = 'druxt.auth.flow'

/**
 * The name of the error `handleCallback()` throws for a callback it refuses.
 *
 * A callback is refused when this browser did not start it, or already took it.
 */
export const DRUXT_AUTH_CALLBACK_REFUSED = 'DruxtAuthCallbackRefused'

/**
 * The name of the error `loginWithPassword()` and `loginWithDrupal()` reject with while the visitor is signed in.
 *
 * Nothing was sent, and the session and `user` are as they were. Sign out first to sign in as someone else.
 *
 * @example @lang ts
 * try {
 *   await useDruxtAuth().loginWithPassword({ username, password })
 * } catch (error) {
 *   if ((error as Error).name !== DRUXT_AUTH_SIGNED_IN) throw error
 * }
 */
export const DRUXT_AUTH_SIGNED_IN = 'DruxtAuthSignedIn'

/** What a sign-in at Drupal keeps in session storage, for the callback page to finish it. */
interface Flow {
  state?: string
  verifier?: string
  redirect?: string
  redirectUri?: string
}

/** What `useDruxtAuth()` returns. */
export interface DruxtAuthComposable {
  /** Whether the visitor is signed in. */
  loggedIn: ComputedRef<boolean>
  /** The signed-in user, or null when there is none or it has not been fetched. */
  user: Ref<UserInfo | null>
  /** Whether the password grant is offered. */
  password: boolean
  /**
   * Fetches the signed-in user.
   *
   * It also sets `user`. `user` holds null for no user, as Nuxt state does.
   *
   * @returns The user, or undefined when signed out or when the user could not be fetched.
   */
  fetchUser(): Promise<UserInfo | undefined>
  /**
   * Signs in with the password grant, then reloads the app on `redirect`.
   *
   * Rejects with `DRUXT_AUTH_SIGNED_IN` while signed in.
   */
  loginWithPassword(credentials: { username: string, password: string }, redirect?: string): Promise<void>
  /**
   * Sends the visitor to Drupal's sign-in. Drupal sends them back through the callback page.
   *
   * Rejects with `DRUXT_AUTH_SIGNED_IN` while signed in.
   */
  loginWithDrupal(redirect?: string): Promise<void>
  /**
   * Finishes the authorization code grant from the callback's query.
   *
   * A visitor who is already signed in is sent on, and no code is exchanged. They go to the page the sign-in was
   * for, or to the front page when this browser did not start the callback.
   *
   * @throws An error named `DRUXT_AUTH_CALLBACK_REFUSED` for a callback this browser did not start, or already took.
   */
  handleCallback(query: { code?: unknown, state?: unknown }): Promise<void>
  /** Signs out, then reloads the app on `redirect`. */
  logout(redirect?: string): Promise<void>
}

/**
 * Druxt auth in a component: the signed-in user and the sign-in flows.
 *
 * Signing in or out empties the Druxt caches and reloads the app. Every module then renders again for the new
 * visitor, on the server.
 *
 * No one signs in while signed in. The sign-ins reject with `DRUXT_AUTH_SIGNED_IN` until the visitor signs out.
 */
export const useDruxtAuth = (): DruxtAuthComposable => {
  const nuxtApp = useNuxtApp()
  const auth = nuxtApp.$druxt.auth
  // The client's auth options. The public config adds the login path, the callback path and the password flag.
  const settings = nuxtApp.$druxt.options.auth as DruxtPublicAuthOptions | undefined
  const user = useState<UserInfo | null>('druxt-auth-user', () => null)
  // The router gives a route's address under the app's `baseURL`. A reload and Drupal's redirect leave the app, so
  // they need that whole address.
  const router = useRouter()

  const requireAuth = () => {
    if (!auth || !settings) throw new Error('[druxt] Auth is not configured: set druxt.auth.')
    return { auth, settings }
  }

  // Signing in again needs signing out first. Nothing is sent, and the session and the user stay as they were.
  const requireSignedOut = () => {
    const configured = requireAuth()
    if (configured.auth.loggedIn) {
      throw Object.assign(new Error('Already signed in: sign out before signing in again.'), { name: DRUXT_AUTH_SIGNED_IN })
    }
    return configured
  }

  const fetchUser = async () => {
    const fetched = auth?.loggedIn ? await auth.getUser().catch(() => undefined) : undefined
    user.value = fetched ?? null
    return fetched
  }

  // A failed sign-in leaves the page with no user. It never leaves the user of a session that ended before it.
  const signedOut = (error: unknown): never => {
    if (!auth?.loggedIn) user.value = null
    throw error
  }

  // Empties the caches and reloads the app on a path, after a sign-in or a sign-out.
  const after = async (path: string) => {
    // The drafts are closed too, so the next user never sees this one's unsaved edits.
    useDruxtStore(nuxtApp.$pinia).clearCache({ drafts: true })
    await reloadNuxtApp({ path: router.resolve(sitePath(path)).href, force: true })
  }

  return {
    // This is reactive because the cookie storage reads refs.
    loggedIn: computed(() => !!auth?.loggedIn),
    user,
    password: !!settings?.password,
    fetchUser,

    async loginWithPassword(credentials, redirect = '/') {
      await requireSignedOut().auth.loginWithPassword(credentials).catch(signedOut)
      await fetchUser()
      return after(redirect)
    },

    // The authorization code grant. The visitor goes to Drupal and comes back through the callback page.
    async loginWithDrupal(redirect = '/') {
      const { auth, settings } = requireSignedOut()
      const redirectUri = `${window.location.origin}${router.resolve(settings.callback).href}`
      const { url, state, verifier } = await auth.authorize({ redirectUri })
      sessionStorage.setItem(STATE, JSON.stringify({ state, verifier, redirect, redirectUri } satisfies Flow))
      window.location.assign(url)
    },

    async handleCallback({ code, state }) {
      const flow = JSON.parse(sessionStorage.getItem(STATE) || '{}') as Flow
      sessionStorage.removeItem(STATE)
      // Signing in again needs signing out first. A visitor already signed in is sent on, and the code is never used.
      if (auth?.loggedIn) {
        await navigateTo(sitePath(flow.state && flow.state === state ? flow.redirect || '/' : '/'), { replace: true })
        return
      }
      if (typeof code !== 'string' || !flow.state || flow.state !== state || !flow.verifier || !flow.redirectUri) {
        // The callback page shows this message to the visitor.
        throw Object.assign(new Error('The sign-in did not come from this site, or was already used.'), { name: DRUXT_AUTH_CALLBACK_REFUSED })
      }
      await requireAuth().auth.exchangeCode({ code, verifier: flow.verifier, redirectUri: flow.redirectUri }).catch(signedOut)
      return after(flow.redirect || '/')
    },

    async logout(redirect = '/') {
      await requireAuth().auth.logout()
      user.value = null
      return after(redirect)
    },
  }
}
