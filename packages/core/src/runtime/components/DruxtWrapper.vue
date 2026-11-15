<script lang="ts">
import { Comment, defineComponent, Fragment, h, normalizeClass, renderSlot } from 'vue'
import type { ClassValue, PropType, SlotsType, StyleValue, VNode, VNodeArrayChildren } from 'vue'
import { DRUXT_MODULE } from '../context'
import type { DruxtModuleContext } from '../context'

/** Whether an attribute sets nothing: missing, blank, or an empty object or array. */
const isEmptyAttr = (value: unknown): boolean => value === undefined || value === null || value === false
  || (typeof value === 'string' && !value.trim())
  || (Array.isArray(value) && value.every(isEmptyAttr))
  || (typeof value === 'object' && !Array.isArray(value) && !Object.keys(value as object).length)

/** Whether rendered children hold anything but comments and empty fragments. */
const hasContent = (children: VNodeArrayChildren | undefined): boolean => (children || []).some((child) => {
  if (Array.isArray(child)) return hasContent(child)
  if (!child || typeof child !== 'object') return child !== null && child !== undefined && child !== false && child !== true && child !== ''
  const node = child as VNode
  if (node.type === Comment) return false
  if (node.type === Fragment) return hasContent(node.children as VNodeArrayChildren)
  return true
})

/** The id, class and style from a set of attributes, each left off when empty. */
const bindings = (attrs: { id?: unknown, class?: unknown, style?: unknown }): Record<string, unknown> =>
  Object.fromEntries(Object.entries({ id: attrs.id === undefined ? undefined : String(attrs.id), class: attrs.class, style: attrs.style })
    .filter(([, value]) => !isEmptyAttr(value)))

/**
 * Placeholder component for the Druxt Wrapper theming system.
 */
export default defineComponent({
  name: 'DruxtWrapper',

  // The module's context: Nuxt registers global components async, so $parent is the async wrapper.
  inject: { druxtModule: { from: DRUXT_MODULE, default: null } },

  inheritAttrs: false,

  props: {
    /**
     * The module's own attributes for the element, such as DruxtEntity's classes and anchors, from its contract's
     * `wrapperAttrs()`. Unlike the site's, they add an element only around content. Given, even empty, they add one,
     * as the module has a root of its own whatever its attributes. Their classes join the site's, but an `id` or a
     * `style` set on this wrapper replaces theirs whole, and one set on the module replaces both.
     */
    moduleAttrs: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    /** The element the module's root is, from its contract's `wrapperTag`, such as DruxtEntityForm's `form`. */
    moduleTag: { type: String, default: 'div' },
  },

  // Declared for the render function, which no template shows: the default slot gets the module's attributes, less
  // its id, class and style.
  slots: Object as SlotsType<{ default: Record<string, unknown> }>,

  computed: {
    // The class, style and id set on the module or on this wrapper, which only an element can carry.
    elementAttrs(): { id?: string, class?: ClassValue, style?: StyleValue } {
      const module = this.druxtModule as DruxtModuleContext | null
      const { id, style } = { ...this.moduleAttrs, ...this.$attrs, ...module?.attrs }
      // The module's own classes, such as DruxtEntity's, with the site's. Each once: as the module's root, this
      // wrapper's attributes already hold the site's.
      const classes = [...new Set(normalizeClass([this.moduleAttrs?.class, this.$attrs.class, module?.attrs.class]).split(/\s+/).filter(Boolean))]
      return { id: id === undefined ? undefined : String(id), class: classes.join(' '), style: style as StyleValue }
    },

    // The element's attributes, less any left empty: a server render writes an empty style as `style=""`. The module's
    // own others, such as DruxtEntity's `data-druxt-*` anchors, go on it too.
    elementBindings(): Record<string, unknown> {
      const { id, class: _class, style, ...others } = this.moduleAttrs || {}
      void id
      void _class
      void style
      return Object.fromEntries(Object.entries({ ...this.elementAttrs, ...others }).filter(([, value]) => !isEmptyAttr(value)))
    },

    // What the site set, on the module or on this wrapper, which keeps the element even with nothing in it.
    siteBindings(): Record<string, unknown> {
      const module = this.druxtModule as DruxtModuleContext | null
      return { ...bindings(this.$attrs), ...bindings(module?.attrs || {}) }
    },

    // The module's attributes, for the default slot, less the one-element `id`.
    slotAttrs(): Record<string, unknown> {
      const module = this.druxtModule as DruxtModuleContext | null
      const attrs: Record<string, unknown> = { ...module?.attrs }
      delete attrs.id
      // Vue 2's $attrs had neither; the module's root already carries them.
      delete attrs.class
      delete attrs.style
      return attrs
    },
  },

  // An element only when there is something to put on one, or a module has a root. 1.x always rendered a div. A module's
  // root, such as DruxtEntity's, needs content too: a module that renders nothing renders no element. It stays with
  // no attributes at all, so the class policy never changes the structure.
  render() {
    const slot = renderSlot(this.$slots, 'default', this.slotAttrs)
    const element = Object.keys(this.siteBindings).length > 0
      || ((this.moduleAttrs !== undefined || Object.keys(this.elementBindings).length > 0) && hasContent(slot.children as VNodeArrayChildren))
    return element ? h(this.moduleTag, this.elementBindings, [slot]) : slot
  },
})
</script>
