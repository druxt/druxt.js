<script lang="ts">
import { Comment, defineComponent, Fragment, h, normalizeClass, renderSlot } from 'vue'
import type { ClassValue, PropType, SlotsType, StyleValue, VNode, VNodeArrayChildren } from 'vue'
import { DRUXT_MODULE } from '../context'
import type { DruxtModuleContext } from '../context'

/** Whether an attribute sets nothing. That is a missing or blank value, or an empty object or array. */
const isEmptyAttr = (value: unknown): boolean => value === undefined || value === null || value === false
  || (typeof value === 'string' && !value.trim())
  || (Array.isArray(value) && value.every(isEmptyAttr))
  || (typeof value === 'object' && !Array.isArray(value) && !Object.keys(value as object).length)

/** Whether rendered children hold anything other than comments and empty fragments. */
const hasContent = (children: VNodeArrayChildren | undefined): boolean => (children || []).some((child) => {
  if (Array.isArray(child)) return hasContent(child)
  if (!child || typeof child !== 'object') return child !== null && child !== undefined && child !== false && child !== true && child !== ''
  const node = child as VNode
  if (node.type === Comment) return false
  if (node.type === Fragment) return hasContent(node.children as VNodeArrayChildren)
  return true
})

/** The id, class and style from a set of attributes. Each is left out when empty. */
const bindings = (attrs: { id?: unknown, class?: unknown, style?: unknown }): Record<string, unknown> =>
  Object.fromEntries(Object.entries({ id: attrs.id === undefined ? undefined : String(attrs.id), class: attrs.class, style: attrs.style })
    .filter(([, value]) => !isEmptyAttr(value)))

/**
 * The default wrapper of the Druxt Wrapper theming system.
 *
 * A module renders it when no wrapper component of the site's or a module's matches. It renders its default slot,
 * inside an element only when there is something to put on one.
 */
export default defineComponent({
  name: 'DruxtWrapper',

  // The module's context is injected. Nuxt registers global components async, so `$parent` is the async wrapper, not
  // the module.
  inject: { druxtModule: { from: DRUXT_MODULE, default: null } },

  inheritAttrs: false,

  props: {
    /**
     * The module's own attributes for the element, from its contract's `wrapperAttrs()`. DruxtEntity's classes and
     * anchors are one example.
     *
     * - Unlike the site's attributes, they add an element only around content.
     * - When given, even empty, they add one. The module has a root of its own, whatever its attributes.
     * - Their classes join the site's.
     * - An `id` or a `style` set on this wrapper replaces theirs whole. One set on the module replaces both.
     */
    moduleAttrs: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    /** The element of the module's root, from its contract's `wrapperTag`, such as DruxtEntityForm's `form`. */
    moduleTag: { type: String, default: 'div' },
  },

  // The slots are declared for the render function, as there is no template to show them. The default slot gets the
  // module's attributes, without its id, class and style.
  slots: Object as SlotsType<{ default: Record<string, unknown> }>,

  computed: {
    // The class, style and id set on the module or on this wrapper. Only an element can carry them.
    elementAttrs(): { id?: string, class?: ClassValue, style?: StyleValue } {
      const module = this.druxtModule as DruxtModuleContext | null
      const { id, style } = { ...this.moduleAttrs, ...this.$attrs, ...module?.attrs }
      // The module's own classes, such as DruxtEntity's, joined with the site's. Each class appears once. As the
      // module's root, this wrapper's attributes already hold the site's classes.
      const classes = [...new Set(normalizeClass([this.moduleAttrs?.class, this.$attrs.class, module?.attrs.class]).split(/\s+/).filter(Boolean))]
      return { id: id === undefined ? undefined : String(id), class: classes.join(' '), style: style as StyleValue }
    },

    // The element's attributes, without any left empty. A server render would write an empty style as `style=""`.
    // The module's other attributes, such as DruxtEntity's `data-druxt-*` anchors, go on the element too.
    elementBindings(): Record<string, unknown> {
      const { id, class: _class, style, ...others } = this.moduleAttrs || {}
      void id
      void _class
      void style
      return Object.fromEntries(Object.entries({ ...this.elementAttrs, ...others }).filter(([, value]) => !isEmptyAttr(value)))
    },

    // What the site set, on the module or on this wrapper. It keeps the element even with nothing in it.
    siteBindings(): Record<string, unknown> {
      const module = this.druxtModule as DruxtModuleContext | null
      return { ...bindings(this.$attrs), ...bindings(module?.attrs || {}) }
    },

    // The module's attributes, for the default slot. The `id` is left out, as only one element can have it.
    slotAttrs(): Record<string, unknown> {
      const module = this.druxtModule as DruxtModuleContext | null
      const attrs: Record<string, unknown> = { ...module?.attrs }
      delete attrs.id
      // Vue 2's `$attrs` had neither class nor style. The module's root already carries them.
      delete attrs.class
      delete attrs.style
      return attrs
    },
  },

  // An element is rendered only when there is something to put on one, or when a module has a root. 1.x always
  // rendered a div.
  //
  // A module's root, such as DruxtEntity's, needs content too: a module that renders nothing renders no element.
  // Around content, the root stays even with no attributes at all, so the class policy never changes the structure.
  render() {
    const slot = renderSlot(this.$slots, 'default', this.slotAttrs)
    const element = Object.keys(this.siteBindings).length > 0
      || ((this.moduleAttrs !== undefined || Object.keys(this.elementBindings).length > 0) && hasContent(slot.children as VNodeArrayChildren))
    return element ? h(this.moduleTag, this.elementBindings, [slot]) : slot
  },
})
</script>
