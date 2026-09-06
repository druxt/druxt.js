/**
 * Renders fenced ```mermaid blocks into SVG diagrams.
 *
 * Client-side by design: mermaid 8 is the last major that bundles under
 * webpack 4. Styling is deliberately NOT mermaid's: assets/css/app.css
 * restyles the SVG classes from the site's daisyUI tokens, so diagrams
 * follow the colour mode live with no re-render. Until JavaScript runs,
 * the page shows the diagram source, which reads as a text description.
 *
 * Authoring contract: a first line of `%% <text>` becomes the figure's
 * caption and the SVG's accessible name. Consecutive fences inside
 * <div class="docs-diagram-row"> render as a row of cards (app.css).
 */

let uid = 0
let mermaidReady
// Live observers, so navigation away from a page releases its diagrams.
let observers = []

// Layout values are the design spec; font sizes and weights match the
// app.css text rules so mermaid measures what renders.
const config = {
  startOnLoad: false,
  // Mermaid's default, pinned: rendered SVG lands in the page via innerHTML.
  securityLevel: 'strict',
  theme: 'neutral',
  fontFamily: 'inherit',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'monotoneX',
    padding: 10,
    nodeSpacing: 32,
    rankSpacing: 48,
    diagramPadding: 4,
  },
  sequence: {
    useMaxWidth: true,
    wrap: true,
    width: 150,
    height: 44,
    actorMargin: 18,
    diagramMarginX: 4,
    diagramMarginY: 8,
    boxMargin: 8,
    boxTextMargin: 6,
    noteMargin: 8,
    messageMargin: 28,
    mirrorActors: false,
    bottomMarginAdj: 4,
    actorFontSize: 13,
    actorFontWeight: 600,
    messageFontSize: 13,
    noteFontSize: 13,
  },
}
// Sequence actors size to fill the column the diagram sits in, so labels
// render at their CSS size instead of scaling with the SVG.
const actorWidth = { min: 120, max: 200 }

// Only diagram pages pay for the library; everything else skips the chunk.
const ensureMermaid = () => {
  mermaidReady =
    mermaidReady ||
    import('mermaid').then((m) => {
      m.default.initialize(config)
      return m.default
    })
  return mermaidReady
}

const participants = (source) => {
  const declared = source.match(/^\s*(participant|actor)\s/gm)
  if (declared) return declared.length
  const ids = new Set()
  source.replace(/^\s*([\w-]+)\s*(?:-->>|->>|-->|->|--x|-x|--\)|-\))\s*([\w-]+)\s*:/gm, (m, from, to) => {
    ids.add(from)
    ids.add(to)
  })
  return ids.size || 1
}

const fitActors = (mermaid, container, source) => {
  if (!/^\s*sequenceDiagram/m.test(source)) return
  const { diagramMarginX, actorMargin } = config.sequence
  const n = participants(source)
  const column = container.clientWidth
  if (!column) return
  const width = Math.floor((column - 2 * diagramMarginX - (n - 1) * actorMargin) / n)
  mermaid.initialize({
    ...config,
    sequence: { ...config.sequence, width: Math.max(actorWidth.min, Math.min(actorWidth.max, width)) },
  })
}

// figure > frame > scroller > svg, then the caption. The frame's fade and
// the scroller's tab stop exist only while there is more to scroll.
const wrap = (container, svg, label) => {
  const frame = document.createElement('div')
  frame.className = 'docs-diagram-frame'
  const scroller = document.createElement('div')
  scroller.className = 'docs-diagram-scroll'
  // Named, because it is a tab stop while it overflows.
  scroller.setAttribute('role', 'region')
  scroller.setAttribute('aria-label', label || 'Diagram')
  scroller.appendChild(svg)
  frame.appendChild(scroller)
  container.innerHTML = ''
  container.appendChild(frame)
  if (label) {
    const caption = document.createElement('figcaption')
    caption.id = `${svg.id}-caption`
    caption.textContent = label
    container.appendChild(caption)
    svg.setAttribute('aria-labelledby', caption.id)
  }
  const update = () => {
    const overflow = scroller.scrollWidth > scroller.clientWidth + 1
    const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1
    frame.toggleAttribute('data-overflow', overflow && !atEnd)
    if (overflow) scroller.setAttribute('tabindex', '0')
    else scroller.removeAttribute('tabindex')
  }
  scroller.addEventListener('scroll', update, { passive: true })
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    observers.push({ observer, target: scroller })
  }
  update()
}

const disconnectStale = () => {
  observers = observers.filter(({ observer, target }) => {
    if (target.isConnected) return true
    observer.disconnect()
    return false
  })
}

const renderInto = (mermaid, container, source) => {
  // The caption is the first line only.
  const label = (/^%% (.+)/.exec(source) || [])[1]
  try {
    fitActors(mermaid, container, source)
    mermaid.render(`docs-diagram-${uid++}`, source, (svg) => {
      // Mermaid 8 reports parse failures through an empty callback rather
      // than a throw; fall back to the readable source either way.
      if (!svg) {
        container.textContent = source
        return
      }
      container.innerHTML = svg
      const el = container.querySelector('svg')
      if (!el) return
      el.setAttribute('role', 'img')
      if (label) el.setAttribute('aria-label', label)
      el.removeAttribute('height')
      // Drop mermaid's embedded stylesheet: its #id-prefixed rules outrank
      // the site styles that give diagrams their colour-mode palette.
      el.querySelectorAll('style').forEach((style) => style.remove())
      // useMaxWidth scales the diagram to its column; on a phone that
      // shrank 14px labels to 4px. app.css reads this floor below 640px,
      // where the diagram then scrolls in its frame instead.
      const natural = parseFloat((el.getAttribute('viewBox') || '').split(/\s+/)[2])
      if (natural) el.style.setProperty('--docs-diagram-floor', `${Math.round(natural * 0.85)}px`)
      wrap(container, el, label)
    })
  } catch (e) {
    // Leave the readable source in place; a broken diagram must not take
    // the page down with it.
    container.textContent = source
  }
}

const renderAll = () => {
  disconnectStale()
  if (!document.querySelector('pre code.language-mermaid, pre.language-mermaid code')) return
  ensureMermaid().then((mermaid) => {
    document.querySelectorAll('pre code.language-mermaid, pre.language-mermaid code').forEach((code) => {
      const wrapper = code.closest('.nuxt-content-highlight') || code.closest('.docs-code') || code.closest('pre')
      if (!wrapper) return
      const source = code.textContent.trim()
      const container = document.createElement('figure')
      container.className = 'docs-diagram not-prose'
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
