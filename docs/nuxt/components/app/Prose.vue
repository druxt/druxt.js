<template>
  <div ref="prose" class="prose">
    <!--
      Keyed on the document path so each document gets a brand-new subtree.
      enhance() below rewrites DOM that NuxtContent owns — figures() wraps
      each <img> in a <figure> and re-parents it — which leaves Vue patching
      against a tree that no longer matches its vnodes. Measured without the
      key, navigating blocks -> entity -> blocks: an orphaned empty <figure>
      persisted onto pages with no images at all, and returning to a
      two-image page rendered only one. Re-creating the subtree keeps the
      imperative enhancement from ever meeting a stale patch.
    -->
    <NuxtContent :key="document.path" :document="document" />

    <!--
      Lightbox for prose images. figures() gives every image a cursor-zoom-in
      frame and a click handler; this renders the result locally rather than
      emitting to a parent, because the only consumer (pages/modules/_.vue)
      never listened for it — the affordance was there but the click did
      nothing. Mirrors AppFigure's own lightbox.
    -->
    <div
      v-if="zoom"
      class="fixed inset-0 z-[80] bg-neutral/80 p-6 flex items-center justify-center cursor-[zoom-out]"
      @click="zoom = null"
    >
      <img :src="zoom.src" :alt="zoom.alt" class="max-h-full max-w-full rounded-box shadow-2xl">
    </div>
  </div>
</template>

<script>
/**
 * NuxtContent with the module-page conventions applied.
 *
 * @nuxt/content v1 has no prose component overrides, so the rendered output is
 * enhanced after mount. Everything here is a treatment of markdown the modules
 * already write — no content changes required:
 *
 * - images become captioned, click-to-enlarge figures (alt text is the caption)
 * - code blocks get a copy button
 * - the "For more details, refer to the … API documentation" lines the modules
 *   end each component section with become buttons rather than bullet points
 * - the `* * *` rules between sections are hidden; the headings already
 *   separate them, and eight per page is noise
 */
export default {
  props: {
    document: { type: Object, required: true },
  },

  /** The image currently enlarged, as { src, alt }; null when closed. */
  data: () => ({ zoom: null }),

  mounted() {
    this.$nextTick(this.enhance)
    this.onKey = (e) => { if (e.key === 'Escape') this.zoom = null }
    window.addEventListener('keydown', this.onKey)
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKey)
    document.documentElement.style.overflow = ''
  },

  watch: {
    document() {
      this.$nextTick(this.enhance)
    },

    zoom(open) {
      document.documentElement.style.overflow = open ? 'hidden' : ''
    },

    $route() {
      this.zoom = null
    },
  },

  methods: {
    enhance() {
      const root = this.$refs.prose
      if (!root) return

      this.figures(root)
      this.copyButtons(root)
      this.apiLinks(root)
      root.querySelectorAll('hr').forEach((hr) => hr.setAttribute('data-decorative', ''))
    },

    figures(root) {
      root.querySelectorAll('img:not([data-enhanced])').forEach((img) => {
        img.setAttribute('data-enhanced', '')

        const figure = document.createElement('figure')
        figure.className = 'not-prose my-8'

        const frame = document.createElement('div')
        frame.className = 'rounded-box overflow-hidden border border-base-300 bg-base-200 cursor-[zoom-in]'
        frame.addEventListener('click', () => { this.zoom = { src: img.src, alt: img.alt } })

        img.parentNode.insertBefore(figure, img)
        frame.appendChild(img)
        figure.appendChild(frame)

        if (img.alt) {
          const caption = document.createElement('figcaption')
          caption.className = 'mt-2 text-sm text-base-content/55'
          caption.textContent = img.alt
          figure.appendChild(caption)
        }
      })
    },

    copyButtons(root) {
      root.querySelectorAll('pre:not([data-enhanced])').forEach((pre) => {
        pre.setAttribute('data-enhanced', '')
        pre.classList.add('relative', 'group')

        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = 'Copy'
        // A label, because every one of these otherwise reads as a bare
        // "Copy". Its focus visibility lives in assets/css/app.css: with only
        // a hover variant the button stayed fully transparent while focused —
        // in the tab order, but invisible to the keyboard user on it.
        button.setAttribute('aria-label', 'Copy code to clipboard')
        button.className = 'absolute top-2 right-2 px-2 py-1 rounded-btn text-xs bg-white/10 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity'
        // navigator.clipboard is undefined on non-secure origins (a preview
        // served over plain HTTP), and writeText can reject on a permission
        // denial — without this the button silently never reacts and the
        // rejection goes unhandled.
        button.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(pre.innerText.replace(/\nCopy$/, ''))
            button.textContent = 'Copied'
          } catch (e) {
            button.textContent = 'Copy failed'
          }
          setTimeout(() => { button.textContent = 'Copy' }, 1500)
        })

        pre.appendChild(button)
      })
    },

    apiLinks(root) {
      root.querySelectorAll('li > a[href^="/api/"]').forEach((link) => {
        const li = link.parentNode
        if (li.children.length !== 1 || li.dataset.enhanced) return
        li.dataset.enhanced = ''
        li.classList.add('list-none', 'ml-0')
        link.className = 'not-prose inline-flex items-center gap-2 px-3 py-1.5 rounded-btn border border-base-300 text-sm no-underline hover:border-primary'
      })
    },
  },
}
</script>
