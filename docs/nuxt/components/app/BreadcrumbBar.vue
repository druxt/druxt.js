<template>
  <!--
    The unified sticky breadcrumb. Second sticky layer under the site header:
    the trail carries the current section, every crumb with siblings opens
    them through AppDropdown, and the trail ends in a live crumb for the
    heading currently in view, whose menu is the on-this-page list. On module
    detail pages the module tab bar stacks beneath as the third layer.

    On short viewports (under 800px tall, half the desktop audience is
    1366x768) the bar hides on downward scroll and returns on upward scroll —
    except where the module tab bar stacks beneath it, whose static 108px pin
    would otherwise expose a see-through band where this bar was.
  -->
  <div
    v-if="crumbs.length > 1"
    class="sticky top-16 z-40 -mx-5 sm:-mx-8 lg:-mx-12 -mt-8 lg:-mt-12 mb-8
           border-b border-base-300 bg-base-100/95 backdrop-blur
           transition-transform"
    :class="hidden ? 'translate-y-[-200%]' : ''"
  >
    <nav class="px-5 sm:px-8 lg:px-12 h-11 flex items-center gap-1 text-sm" aria-label="Breadcrumb">
      <!-- Ancestors collapse into one menu below sm. -->
      <AppDropdown
        v-if="ancestorItems.length"
        class="sm:hidden"
        :items="ancestorItems"
        button-class="px-1.5 py-1 text-base-content/70 hover:bg-base-200"
      >
        <span aria-hidden="true">…</span>
        <span class="sr-only">Parent pages</span>
      </AppDropdown>

      <ol class="hidden sm:flex items-center gap-1 min-w-0">
        <li v-for="(crumb, index) of ancestors" :key="crumb.key" class="flex items-center gap-1">
          <span v-if="index" class="text-base-content/40" aria-hidden="true">/</span>
          <AppDropdown
            v-if="crumb.items"
            :items="crumb.items"
            :button-class="crumb.current
              ? 'px-1.5 py-1 font-semibold hover:bg-base-200'
              : 'px-1.5 py-1 text-base-content/70 hover:bg-base-200 hover:text-base-content'"
          >
            <span class="truncate max-w-xs" :aria-current="crumb.current ? 'page' : null">{{ crumb.label }}</span>
          </AppDropdown>
          <NuxtLink
            v-else-if="crumb.to"
            class="px-1.5 py-1 rounded-btn text-base-content/70 hover:bg-base-200 hover:text-base-content"
            :to="crumb.to"
            v-text="crumb.label"
          />
          <span
            v-else
            class="px-1.5 py-1 truncate max-w-xs"
            :class="crumb.current ? 'text-base-content' : 'text-base-content/70'"
            :aria-current="crumb.current ? 'page' : null"
            v-text="crumb.label"
          />
        </li>
      </ol>

      <span class="text-base-content/40" aria-hidden="true">/</span>
      <AppDropdown
        v-if="leaf.items"
        :items="leaf.items"
        button-class="px-1.5 py-1 font-semibold hover:bg-base-200"
      >
        <span class="truncate max-w-[11rem] sm:max-w-xs" :aria-current="leaf.current ? 'page' : null">{{ leaf.label }}</span>
      </AppDropdown>
      <span
        v-else
        class="px-1.5 py-1 font-semibold truncate max-w-[11rem] sm:max-w-xs"
        :aria-current="leaf.current ? 'page' : null"
        v-text="leaf.label"
      />
    </nav>
  </div>
</template>

<script>
import { modulePkgs } from './icon/module'

const SHORT_VIEWPORT = 800

/** Scroll offset that counts a heading as reached: the sticky stack plus a line. */
const HEADING_OFFSET = 176

export default {
  name: 'AppBreadcrumbBar',

  data: () => ({ hidden: false, lastY: 0, activeHeading: null }),

  computed: {
    parts: ({ $route }) => $route.path.split('/').filter(Boolean),

    /** Component reference pages belong to the Components section, per the
     * same rule the sidebar applies. */
    isComponentRef() {
      const [first, second, , fourth] = this.parts
      return first === 'api' && second === 'packages' && fourth === 'components'
    },

    /** The top-level menu item the route sits under. */
    sectionItem() {
      if (this.isComponentRef) {
        return this.$store.state.menu.find((item) => ((item.props || {}).to || '') === '/components') || null
      }
      return this.$store.state.menu.find((item) => {
        const to = ((item.props || {}).to || '').replace(/\/$/, '')
        return to && to !== '/' && this.$route.path.startsWith(to)
      }) || null
    },

    /** The documentation sections, for the section crumb's menu. */
    sectionItems() {
      return this.$store.state.menu
        .map((item) => ({ text: item.text, to: ((item.props || {}).to || '') }))
        .filter((item) => item.to.length > 1)
    },

    moduleItems() {
      return (this.$store.state.modules || []).map((m) => ({ text: m.title, to: m.dir }))
    },

    apiPackageItems() {
      return (this.$store.state.modules || []).map((m) => ({
        text: m.title,
        // The generated api tree keys packages by unprefixed slug.
        to: '/api/packages/' + m.dir.split('/')[2],
      }))
    },

    /**
     * Sibling documents of the current section, from the menu children
     * nuxtServerInit indexes. The section root itself is not a sibling.
     */
    sectionDocItems() {
      const sectionTo = (((this.sectionItem || {}).props || {}).to || '').replace(/\/$/, '')
      return (((this.sectionItem || {}).children) || [])
        .map((child) => ({ text: child.text, to: ((child.props || {}).to || '') }))
        .filter((child) => child.to && child.to.replace(/\/$/, '') !== sectionTo)
    },

    /** Module and API package routes stack the module tab bar beneath this bar. */
    pinned() {
      const [first, second, third] = this.parts
      if (first === 'modules' && second) return true
      return first === 'api' && second === 'packages' && !!third
    },

    /**
     * The trail. Every entry: { key, label, to?, items?, current? }.
     * Intermediate API directories render unlinked on purpose: they have no
     * documents behind them, and linking them is how crawlers used to reach
     * generated error pages. When the document has headings, the trail ends
     * one level deeper than the page: a crumb for the heading currently in
     * view, whose menu is the on-this-page list.
     */
    crumbs() {
      const parts = this.parts
      if (!parts.length) return []

      const trail = [{ key: 'home', label: 'Home', to: '/' }]
      const section = this.sectionItem
      if (!section) return this.close(trail.concat([{ key: 'page', label: this.leafTitle }]))

      const sectionTo = (section.props || {}).to
      const atSectionRoot = parts.length === 1
      trail.push({
        key: 'section',
        label: section.text,
        to: atSectionRoot ? undefined : sectionTo,
        items: this.sectionItems,
      })
      if (atSectionRoot) return this.close(trail)

      if (parts[0] === 'modules') {
        const slug = parts[1]
        const module = this.moduleItems.find((m) => m.to.split('/')[2] === slug)
        trail.push({
          key: 'module',
          label: (module || {}).text || this.prettify(slug),
          to: parts.length > 2 ? '/modules/' + slug : undefined,
          items: this.moduleItems,
        })
        if (parts.length > 2) trail.push({ key: 'page', label: this.leafTitle })
        return this.close(trail)
      }

      if (parts[0] === 'api' && parts[1] === 'packages' && parts[2] && !this.isComponentRef) {
        const pkg = parts[2]
        const slug = pkg.replace(/^druxt-/, '')
        const known = modulePkgs.includes(slug)
        // The API menu tree already knows each package's real landing page:
        // a package without an index (test-utils) points at its first
        // reference page there, and linking the bare root here handed the
        // crawler a generated error page.
        const apiItem = this.$store.state.menu.find((item) => ((item.props || {}).to || '') === '/api')
        const pkgEntry = ((apiItem || {}).children || []).find((child) => {
          const to = ((child.props || {}).to || '')
          return to === '/api/packages/' + pkg || to.startsWith('/api/packages/' + pkg + '/')
        })
        trail.push({
          key: 'pkg',
          label: known ? this.prettify(slug) : pkg,
          to: parts.length > 3 ? ((pkgEntry || {}).props || {}).to : undefined,
          items: known ? this.apiPackageItems : undefined,
        })
        if (parts.length > 4) trail.push({ key: 'bucket', label: this.prettify(parts[3]) })
        if (parts.length > 3) trail.push({ key: 'page', label: this.leafTitle })
        return this.close(trail)
      }

      trail.push({
        key: 'page',
        label: this.leafTitle,
        items: this.sectionDocItems.length ? this.sectionDocItems : undefined,
      })
      return this.close(trail)
    },

    ancestors: ({ crumbs }) => crumbs.slice(0, -1),

    leaf: ({ crumbs }) => crumbs[crumbs.length - 1] || { label: '' },

    ancestorItems() {
      return this.ancestors
        .filter((crumb) => crumb.to || crumb.key === 'page')
        .map((crumb) => ({ text: crumb.label, to: crumb.to || this.$route.path }))
    },

    /**
     * The current document's title. Pages record themselves into the
     * recent-documents store as they load, which carries the frontmatter
     * title; the route segment is the fallback for anything that has not.
     */
    leafTitle() {
      const path = this.$route.path.replace(/\/$/, '')
      const recent = (this.$store.state.recent || []).find((r) => (r.to || '').replace(/\/$/, '') === path)
      return (recent || {}).text || this.prettify(this.parts[this.parts.length - 1] || '')
    },

    headings() {
      return (this.$store.state.toc || []).filter((o) => o.depth === 2 || o.depth === 3)
    },

    headingItems() {
      const base = this.headings.length ? Math.min(...this.headings.map((o) => o.depth)) : 2
      return this.headings.map((o) => ({ text: o.text, href: '#' + o.id, indent: o.depth > base }))
    },
  },

  watch: {
    $route() {
      this.hidden = false
      this.activeHeading = null
    },
  },

  mounted() {
    this.onScroll = () => {
      this.spy()
      if (this.pinned || window.innerHeight >= SHORT_VIEWPORT) {
        this.hidden = false
        return
      }
      const y = window.scrollY
      if (y <= 120) this.hidden = false
      else if (Math.abs(y - this.lastY) > 8) this.hidden = y > this.lastY
      this.lastY = y
    }
    window.addEventListener('scroll', this.onScroll, { passive: true })
  },

  beforeDestroy() {
    window.removeEventListener('scroll', this.onScroll)
  },

  methods: {
    /**
     * Ends the trail: marks the page crumb current, then appends the live
     * heading crumb when the document has headings.
     *
     * @param {object[]} trail - The crumbs so far, page crumb last.
     * @returns {object[]} The finished trail.
     */
    close(trail) {
      trail[trail.length - 1].current = true
      if (!this.headingItems.length) return trail
      return trail.concat([{
        key: 'headings',
        label: this.activeHeading || 'On this page',
        items: this.headingItems,
      }])
    },

    /** Tracks which heading is in view, for the trail's tail crumb. */
    spy() {
      let active = null
      for (const heading of this.headings) {
        const el = document.getElementById(heading.id)
        if (el && el.getBoundingClientRect().top <= HEADING_OFFSET) active = heading.text
        else break
      }
      this.activeHeading = active
    },

    /**
     * A readable label from a route segment.
     *
     * @param {string} segment - A route path segment.
     * @returns {string} The segment with dashes as spaces and a capital first letter.
     */
    prettify(segment) {
      const words = segment.replace(/[-_]+/g, ' ').trim()
      return words.charAt(0).toUpperCase() + words.slice(1)
    },
  },
}
</script>
