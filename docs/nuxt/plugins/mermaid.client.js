/**
 * Renders fenced ```mermaid blocks into SVG diagrams.
 *
 * Client-side by design: mermaid 8 is the last major that bundles under
 * webpack 4. Styling is deliberately NOT mermaid's: assets/css/app.css
 * restyles the SVG classes from the site's daisyUI tokens, so diagrams
 * follow the colour mode live with no re-render. Until JavaScript runs,
 * the page shows the diagram source, which reads as a text description.
 *
 * Authoring contract: a first line of `%% <text>` becomes the SVG's
 * accessible label.
 */

let uid = 0
let mermaidReady

// Only diagram pages pay for the library; everything else skips the chunk.
const ensureMermaid = () => {
  mermaidReady =
    mermaidReady ||
    import('mermaid').then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: 'neutral',
        fontFamily: 'inherit',
        flowchart: { useMaxWidth: true },
        // Wrapped messages keep four actors inside the 672px prose column,
        // so labels stay at their CSS size instead of scaling down with
        // the SVG. Font size and weight match the app.css text rules so
        // layout measures what renders.
        sequence: {
          useMaxWidth: true,
          wrap: true,
          width: 150,
          actorMargin: 20,
          diagramMarginX: 8,
          actorFontWeight: 600,
          messageFontSize: 14,
        },
      })
      return m.default
    })
  return mermaidReady
}

const renderInto = (mermaid, container, source) => {
  const label = (source.match(/^%% (.+)$/m) || [])[1]
  try {
    mermaid.render(`docs-diagram-${uid++}`, source, (svg) => {
      // Mermaid 8 reports parse failures through an empty callback rather
      // than a throw; fall back to the readable source either way.
      if (!svg) {
        container.textContent = source
        return
      }
      container.innerHTML = svg
      const el = container.querySelector('svg')
      if (el) {
        el.setAttribute('role', 'img')
        if (label) el.setAttribute('aria-label', label)
        el.removeAttribute('height')
        // Drop mermaid's embedded stylesheet: its #id-prefixed rules outrank
        // the site styles that give diagrams their colour-mode palette.
        el.querySelectorAll('style').forEach((style) => style.remove())
        // useMaxWidth scales the diagram to its column; on a phone that
        // shrank 14px labels to 4px. app.css reads this floor below 640px,
        // where the diagram then scrolls in its container instead.
        const natural = parseFloat((el.getAttribute('viewBox') || '').split(/\s+/)[2])
        if (natural) el.style.setProperty('--docs-diagram-floor', `${Math.round(natural * 0.7)}px`)
      }
    })
  } catch (e) {
    // Leave the readable source in place; a broken diagram must not take
    // the page down with it.
    container.textContent = source
  }
}

const renderAll = () => {
  if (!document.querySelector('pre code.language-mermaid, pre.language-mermaid code')) return
  ensureMermaid().then((mermaid) => {
    document.querySelectorAll('pre code.language-mermaid, pre.language-mermaid code').forEach((code) => {
      const wrapper = code.closest('.nuxt-content-highlight') || code.closest('pre')
      if (!wrapper) return
      const source = code.textContent.trim()
      const container = document.createElement('div')
      container.className = 'docs-diagram'
      wrapper.replaceWith(container)
      renderInto(mermaid, container, source)
    })
  })
}

export default ({ app }) => {
  window.onNuxtReady(() => {
    renderAll()
    app.router.afterEach(() => {
      // Wait for the new page's content to mount.
      setTimeout(renderAll, 50)
      setTimeout(renderAll, 500)
    })
  })
}
