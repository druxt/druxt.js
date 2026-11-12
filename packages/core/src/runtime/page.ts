import { computed, getCurrentInstance, getCurrentScope, onActivated, onDeactivated, onScopeDispose, ref } from 'vue'
import type { Ref } from 'vue'
import { useRoute, useRouter, useState } from '#app'

/** The Nuxt state key that holds who owns the page's title, and for which path. */
export const DRUXT_PAGE_TITLE_STATE = 'druxt:page-title'

/** Who owns the page's title, and the path they claimed it on. */
interface PageTitleState {
  path?: string
  owner?: string
}

/** What `useDruxtPageTitle()` returns. */
export interface DruxtPageTitle {
  /** The owner of the current page's title, or undefined while no one has claimed it. */
  owner: Ref<string | undefined>
  /**
   * Claims the page's title. The first claim on a page wins, and the owner's later claims keep answering `true`.
   *
   * @param owner - Who renders the title, such as `page_title_block`, the same on the server and in the browser.
   * @returns Whether the owner holds the title and so renders the page's `h1`.
   */
  claim(owner: string): boolean
}

/**
 * Which component owns the page's title, so the page renders one `h1`. The page title block and a full-mode
 * `DruxtEntity` both render the title, and each claims it before it does: the first to render holds it and renders
 * the `h1`, and the other renders none. The claim is held in Nuxt state, so the browser hydrates the server's owner,
 * and it is for the page's path, so a client navigation starts again. A query on the same path is the same page.
 *
 * A claimant claims for its own page's route, Nuxt's `useRoute()`, which stays on the outgoing page while it leaves.
 * So a page on its way out, or kept alive and hidden, never takes the title of the page the router is on. When the
 * owner's component unmounts, or is deactivated under `<NuxtPage keepalive>`, the claim is let go, and the next
 * claimant to render takes it.
 *
 * Call it in `setup()` of a component, and claim at render. A claimant needs that setup scope to let its claim go, so
 * a functional component can't be one, and development warns when it is called with no active scope. Two claimants
 * that use the same owner name both hold the title.
 *
 * @example @lang ts
 * const title = useDruxtPageTitle()
 * return () => (title.claim('page_title_block') ? h('h1', label.value) : null)
 */
export function useDruxtPageTitle(): DruxtPageTitle {
  const state = useState<PageTitleState>(DRUXT_PAGE_TITLE_STATE, () => ({}))
  // The claimant's own page: inside a page, Nuxt's route for that page, which lags while the page leaves.
  const route = useRoute()
  const router = useRouter()
  const path = () => route.path
  const owner = computed(() => (state.value.path === path() ? state.value.owner : undefined))
  // What this caller holds, to let go of when its component unmounts or is deactivated.
  let held: { path: string, owner: string } | undefined
  const release = () => {
    if (held && state.value.path === held.path && state.value.owner === held.owner) state.value = {}
    held = undefined
  }

  if (getCurrentScope()) onScopeDispose(release)
  else if (import.meta.dev) console.warn('[druxt] useDruxtPageTitle() was called with no active scope, so its claim is never let go. Call it in a component\'s setup().')
  // A deactivated component still renders when what it read changes, so it claims nothing until it is active again.
  // Read at claim, so activation renders the claimant again and it can take the title back.
  const active = ref(true)
  if (getCurrentInstance()) {
    onDeactivated(() => {
      active.value = false
      release()
    })
    onActivated(() => {
      active.value = true
    })
  }

  return {
    owner,
    claim(name) {
      if (!name) throw new TypeError('[druxt] useDruxtPageTitle().claim() needs an owner, such as \'page_title_block\'.')
      if (!active.value) return false
      const current = owner.value
      if (current !== undefined) {
        if (current === name) held = { path: path(), owner: name }
        return current === name
      }
      // A page the router has left never takes the title of the page it is on.
      if (path() !== router.currentRoute.value.path) return false
      state.value = { path: path(), owner: name }
      held = { path: path(), owner: name }
      return true
    },
  }
}
