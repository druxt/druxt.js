import { defineComponent, h } from 'vue'
import { useRoute } from '#imports'
import { DRUXT_AUTH_CALLBACK_REFUSED, useDruxtAuth } from '../auth'

/**
 * The callback page of the authorization code grant, as druxt-auth 0.x's `/callback`.
 *
 * A visitor who is already signed in is sent on to the page the sign-in was for, and no code is exchanged.
 */
export default defineComponent({
  name: 'DruxtAuthCallback',

  setup() {
    // The route is the page's own, from `useRoute()`. `$route` follows a client navigation only once the page has
    // rendered, after `mounted()`.
    const auth = useDruxtAuth()
    // `signedIn` is read once. A visitor already signed in is sent on, and sees that they are signed in. A visitor
    // signing in here is not told so before the reload.
    return { auth, route: useRoute(), signedIn: auth.loggedIn.value }
  },

  data: () => ({ error: null as string | null }),

  async mounted() {
    try {
      await this.auth.handleCallback(this.route.query)
    } catch (err) {
      // A refused callback says why. Any other failure, such as Drupal refusing the code, shows none of Drupal's
      // text.
      this.error = (err as Error).name === DRUXT_AUTH_CALLBACK_REFUSED ? (err as Error).message : 'Sign in failed. Try again.'
    }
  },

  render() {
    return h('div', { class: 'druxt-auth-callback' }, this.error || (this.signedIn ? 'You are signed in.' : 'Signing in…'))
  },
})
