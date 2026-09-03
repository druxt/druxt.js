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
import mermaid from 'mermaid'

let uid = 0

const renderInto = (container, source) => {
  const label = (source.match(/^%% (.+)$/m) || [])[1]
  try {
    mermaid.render(`docs-diagram-${uid++}`, source, (svg) => {
      container.innerHTML = svg
      const el = container.querySelector('svg')
      if (el) {
        el.setAttribute('role', 'img')
        if (label) el.setAttribute('aria-label', label)
        el.removeAttribute('height')
        // Drop mermaid's embedded stylesheet: its #id-prefixed rules outrank
        // the site styles that give diagrams their colour-mode palette.
        el.querySelectorAll('style').forEach((style) => style.remove())
      }
    })
  } catch (e) {
    // Leave the readable source in place; a broken diagram must not take
    // the page down with it.
    container.textContent = source
  }
}

const renderAll = () => {
  document.querySelectorAll('pre code.language-mermaid, pre.language-mermaid code').forEach((code) => {
    const wrapper = code.closest('.nuxt-content-highlight') || code.closest('pre')
    if (!wrapper) return
    const source = code.textContent.trim()
    const container = document.createElement('div')
    container.className = 'docs-diagram'
    wrapper.replaceWith(container)
    renderInto(container, source)
  })
}

export default ({ app }) => {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    fontFamily: 'inherit',
    flowchart: { useMaxWidth: true },
    sequence: { useMaxWidth: true },
  })
  window.onNuxtReady(() => {
    renderAll()
    app.router.afterEach(() => {
      // Wait for the new page's content to mount.
      setTimeout(renderAll, 50)
      setTimeout(renderAll, 500)
    })
  })
}
