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

/** Calls a handler from a vnode's props, or each handler in a list of them, as Vue would. */
const call = (handler: unknown, event: Event): void => {
  for (const fn of Array.isArray(handler) ? handler : [handler]) if (typeof fn === 'function') fn(event)
}

/**
 * Renders an internal link as Druxt renders it: a custom `NuxtLink` around Druxt's own `<a>`.
 *
 * The link navigates in the app, and the anchor carries only the attributes given.
 *
 * Prefetch:
 *
 * - A custom NuxtLink sets up no prefetch of its own. So the link prefetches its page when the visitor points at it
 *   or focuses it, whenever the site's NuxtLink prefetches at all.
 * - The prefetch NuxtLink makes when a link scrolls into view is the one this link does not make.
 *
 * Classes:
 *
 * - No router class reaches the anchor. The router matches a link by its route, so its `router-link-active` lit Home
 *   on every prefixed page. NuxtLink turns an empty `activeClass` back into the router's.
 * - Druxt's classes and `aria-current` carry the state instead.
 *
 * Handlers: an `onClick`, `onPointerenter` or `onFocus` in `attrs` runs before Druxt's own handler for the event.
 * Each can be a function or a list of functions. A click whose default a handler prevents stays on the page.
 *
 * @param to - The internal path.
 * @param attrs - The anchor's attributes, such as its classes, `aria-current` and event handlers.
 * @param children - The anchor's content.
 * @returns The link's vnode.
 *
 * @example @lang ts
 * druxtLink('/en/recipes', { class: ['druxt-menu__link'], 'aria-current': 'page' }, 'Recipes')
 */
export const druxtLink = (to: string, attrs: Record<string, unknown>, children: VNodeChild): VNode => {
  // The app and the router are read while rendering, where the Nuxt app is reachable. The link needs them for the
  // prefetch it makes itself, when NuxtLink's slot hands it none.
  const nuxtApp = tryUseNuxtApp()
  const router = nuxtApp ? useRouter() : undefined
  // NuxtLink is passed as a plain component, because its own types refuse a slot function in the children.
  return h(NuxtLink as Component, { to, custom: true }, {
    default: ({ href, navigate, prefetch, shouldPrefetch }: CustomLinkSlot) => {
      // Whether to prefetch follows NuxtLink's own rules: its prefetch setting, the link's target and a slow
      // connection. Either mode the site turns on prefetches here, because a custom link cannot watch for the link
      // coming into view.
      //
      // Nuxt 4.4 hands an internal custom link the router's slot alone, with neither `prefetch` nor
      // `shouldPrefetch`. There the link prefetches once on interaction, as NuxtLink does: it calls the app's
      // `link:prefetch` hook and preloads the route's components.
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
