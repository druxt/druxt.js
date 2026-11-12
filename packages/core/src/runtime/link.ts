import { h } from 'vue'
import type { Component, VNode, VNodeChild } from 'vue'
import { NuxtLink } from '#components'
import { preloadRouteComponents, tryUseNuxtApp, useRouter } from '#imports'

/** What a custom NuxtLink's default slot receives. */
interface CustomLinkSlot {
  href: string
  navigate: (event?: MouseEvent) => unknown
  prefetch?: () => Promise<void>
  shouldPrefetch?: (mode: 'visibility' | 'interaction') => boolean
}

/** Calls a handler from a vnode's props, or each of a list of them, as Vue would. */
const call = (handler: unknown, event: Event): void => {
  for (const fn of Array.isArray(handler) ? handler : [handler]) if (typeof fn === 'function') fn(event)
}

/**
 * An internal link as Druxt renders it: a custom `NuxtLink` around Druxt's own `<a>`, so the link navigates in the app
 * and the anchor carries only the attributes given. A custom NuxtLink sets up no prefetch of its own, so the link
 * prefetches its page when the visitor points at it or focuses it, whenever the site's NuxtLink prefetches at all. The
 * prefetch NuxtLink makes when a link scrolls into view is the one it does not make. No router class reaches it: the
 * router matches a link by its route, so its `router-link-active` lit Home on every prefixed page, and NuxtLink turns an
 * empty `activeClass` back into the router's. Druxt's classes and `aria-current` carry the state.
 *
 * An `onClick`, `onPointerenter` or `onFocus` in `attrs`, a function or a list of them, runs before Druxt's own
 * handler for the event. A click whose default a handler prevents stays on the page.
 *
 * @param to - The internal path.
 * @param attrs - The anchor's attributes, such as its classes, `aria-current` and event handlers.
 * @param children - The anchor's content.
 *
 * @example @lang ts
 * druxtLink('/en/recipes', { class: ['druxt-menu__link'], 'aria-current': 'page' }, 'Recipes')
 */
export const druxtLink = (to: string, attrs: Record<string, unknown>, children: VNodeChild): VNode => {
  // Read while rendering, where the Nuxt app is reachable, for the prefetch the floor's slot cannot make.
  const nuxtApp = tryUseNuxtApp()
  const router = nuxtApp ? useRouter() : undefined
  // As a plain component: NuxtLink's own types refuse a slot function in the children.
  return h(NuxtLink as Component, { to, custom: true }, {
    default: ({ href, navigate, prefetch, shouldPrefetch }: CustomLinkSlot) => {
      // NuxtLink's own rules: its prefetch setting, the link's target and a slow connection. Either mode the site
      // turns on prefetches here, as a view of the link cannot be watched from a custom link. Nuxt 4.4 hands an
      // internal custom link the router's slot alone, with neither `prefetch` nor `shouldPrefetch`, so there the link
      // prefetches once on interaction as NuxtLink does: the app's `link:prefetch` hook and the route's components.
      let done = false
      const wanted = () => (shouldPrefetch ? shouldPrefetch('interaction') || shouldPrefetch('visibility') : !done)
      const own = async () => {
        await Promise.all([
          Promise.resolve(nuxtApp?.hooks.callHook('link:prefetch', to)).catch(() => {}),
          !import.meta.dev && router ? preloadRouteComponents(to, router).catch(() => {}) : undefined,
        ])
      }
      const early = () => {
        if (!wanted()) return
        done = true
        void (prefetch ? prefetch() : own())
      }
      const { onClick, onPointerenter, onFocus, ...rest } = attrs
      return h('a', {
        href,
        ...rest,
        onClick: (event: MouseEvent) => {
          call(onClick, event)
          if (!event.defaultPrevented) return navigate(event)
        },
        onPointerenter: (event: PointerEvent) => {
          call(onPointerenter, event)
          early()
        },
        onFocus: (event: FocusEvent) => {
          call(onFocus, event)
          early()
        },
      }, children as VNode[] | string)
    },
  })
}
