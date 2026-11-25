import { computed, defineComponent, h, reactive, ref } from 'vue'
import { useRoute } from '#imports'
import { druxtModuleEmits, druxtModuleProps } from '../props'
import { useDruxtModule } from '../useDruxtModule'
import { useDruxtAuth } from '../auth'

/**
 * A sign-in failure as a message for the visitor. It is never Drupal's own text.
 *
 * @param error - The failure.
 */
const readError = (error: unknown): string => {
  const response = (error as { response?: { status?: number, data?: { message?: string, error?: string } } } | undefined)?.response || {}
  const message = String(response.data?.message || response.data?.error || '')
  if (/access_denied/i.test(message) || /denied the request/i.test(message)) return 'This account is not permitted to sign in here.'
  if (response.status) return 'Check the username and password, then try again. Repeated attempts are blocked for a while.'
  return 'Sign in failed. Try again.'
}

/**
 * The DruxtAuthLogin component: a sign-in form, ported from druxt-auth 0.x.
 *
 * It signs in with the password grant when the site has one. It also offers Drupal's own sign-in, through the
 * authorization code grant.
 *
 * A wrapper component replaces the markup. `propsData` carries the state and the actions, as in 0.x. Two things
 * from 0.x are not ported: the credential sign-in through Drupal's JSON login, and the password reset.
 *
 * While the visitor is signed in:
 *
 * - It shows who is signed in and a button to sign out, instead of the form.
 * - It signs no one in. Signing in again starts with signing out.
 * - Its sign-in actions do nothing, and return before `useDruxtAuth()` would refuse them.
 *
 * The signed-in state's wrapper is `DruxtAuthLoginSignedIn`. The form's wrapper is `DruxtAuthLoginDefault`.
 */
export default defineComponent({
  name: 'DruxtAuthLogin',

  props: {
    ...druxtModuleProps,
    /** Where to go once signed in. When not set, the `redirect` query, then `/`. */
    redirect: { type: String, default: undefined },
  },

  emits: [...druxtModuleEmits, 'submit', 'success', 'error'],

  setup(props, { emit }) {
    const auth = useDruxtAuth()
    const route = useRoute()
    const credentials = reactive({ name: '', pass: '' })
    const busy = ref(false)
    const errorMessage = ref<string | null>(null)
    // The composable has its own rule: it refuses a sign-in while signed in. The actions below return before it
    // would.
    const loggedIn = auth.loggedIn
    const userName = computed(() => auth.user.value?.name || auth.user.value?.preferred_username || '')
    const capabilities = computed(() => ({ password: auth.password, drupal: true }))
    const target = computed(() => {
      const redirect = route.query.redirect
      return props.redirect || (typeof redirect === 'string' ? redirect : '') || '/'
    })

    const submit = async (): Promise<void> => {
      if (busy.value || loggedIn.value) return
      busy.value = true
      errorMessage.value = null
      emit('submit', { name: credentials.name })
      try {
        await auth.loginWithPassword({ username: credentials.name, password: credentials.pass }, target.value)
        credentials.pass = ''
        emit('success')
      } catch (error) {
        errorMessage.value = readError(error)
        emit('error', errorMessage.value)
      } finally {
        busy.value = false
      }
    }
    const signInWithDrupal = async (): Promise<void> => {
      if (busy.value || loggedIn.value) return
      return auth.loginWithDrupal(target.value)
    }
    // Signing out goes back to the page the visitor is on, which then shows the form.
    const signOut = async (): Promise<void> => {
      if (busy.value || !loggedIn.value) return
      busy.value = true
      errorMessage.value = null
      try {
        await auth.logout(route.fullPath)
      } catch {
        errorMessage.value = 'Sign out failed. Try again.'
        emit('error', errorMessage.value)
      } finally {
        busy.value = false
      }
    }

    const field = (type: string, key: 'name' | 'pass', label: string) => h('label', [
      label,
      h('input', {
        type,
        name: key,
        autocomplete: key === 'pass' ? 'current-password' : 'username',
        value: credentials[key],
        onInput: (event: Event) => { credentials[key] = (event.target as HTMLInputElement).value },
      }),
    ])

    const alert = () => errorMessage.value && h('p', { role: 'alert' }, errorMessage.value)
    const signedIn = () => h('div', { class: 'druxt-auth-login druxt-auth-login--signed-in' }, [
      h('p', { class: 'druxt-auth-login__user' }, userName.value ? `Signed in as ${userName.value}.` : 'You are signed in.'),
      h('button', { type: 'button', class: 'druxt-auth-login__sign-out', disabled: busy.value, onClick: () => signOut() }, 'Sign out'),
      alert(),
    ])

    return useDruxtModule(props, {
      componentOptions: () => [[loggedIn.value ? 'signed-in' : 'default']],
      watch: () => [loggedIn.value],
      propsData: () => ({
        busy: busy.value,
        capabilities: capabilities.value,
        credentials,
        error: errorMessage.value,
        loggedIn: loggedIn.value,
        user: auth.user.value,
        submit,
        signInWithDrupal,
        signOut,
      }),
      slots: () => ({
        default: () => loggedIn.value ? signedIn() : h('div', { class: 'druxt-auth-login' }, [
          capabilities.value.password && h('form', { onSubmit: (event: Event) => { event.preventDefault(); submit() } }, [
            field('text', 'name', 'Username'),
            field('password', 'pass', 'Password'),
            h('button', { type: 'submit', disabled: busy.value }, 'Sign in'),
          ]),
          h('button', { type: 'button', class: 'druxt-auth-login__drupal', disabled: busy.value, onClick: () => signInWithDrupal() }, 'Sign in with Drupal'),
          alert(),
        ]),
      }),
    })
  },
})
