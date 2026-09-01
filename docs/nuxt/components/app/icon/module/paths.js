/**
 * The module icon geometry, in one place.
 *
 * Consumed by the icon components (rendered as theme-variable strokes), by
 * lib/og-card.js (rendered with literal hexes through Satori), and by any
 * generator producing the packages' standalone icon.svg files. Change a mark
 * here and every consumer follows.
 *
 * Every entry is [d, tone]: pure path data (rects and circles are
 * re-expressed as paths, which is the one form Satori renders reliably) and
 * the brand tone. 'pf' is the Drupal blue, 'sf' the Nuxt green.
 *
 * CommonJS so nuxt.config.js's generate hook can require it; webpack interop
 * lets the components import from it just as well.
 */
module.exports = {
  druxt: [
    ['M21.5 19.25h-19L9.4 5.5l3.4 6.45', 'pf'],
    ['M12.8 11.95l2.6-5.4 6.1 12.7', 'sf'],
  ],
  blocks: [
    ['M5.5 4.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1 -2 2h-13a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2z', 'pf'],
    ['M3.5 9.5h17', 'pf'],
    ['M10.5 9.5v10', 'sf'],
  ],
  breadcrumb: [
    ['M5 6.5l5.5 5.5L5 17.5M12.5 8.5l3.5 3.5-3.5 3.5', 'pf'],
    ['M20 12h.01', 'sf'],
  ],
  entity: [
    ['M5.5 5h13a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-13a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2z', 'pf'],
    ['M6.5 10.75a1.75 1.75 0 1 0 3.5 0a1.75 1.75 0 1 0 -3.5 0', 'pf'],
    ['M12.75 9.75H17M12.75 13.25H17M7 16.25h10', 'sf'],
  ],
  menu: [
    ['M4.5 6h.01M4.5 12h.01M8 18h.01', 'pf'],
    ['M9 6h10.5M9 12h10.5M12.5 18h7', 'sf'],
  ],
  router: [
    ['M3.5 18.25a2.25 2.25 0 1 0 4.5 0a2.25 2.25 0 1 0 -4.5 0', 'pf'],
    ['M7.4 16.6c3.2-2.6 1.4-6.1 4.4-8.1 1.3-.87 2.5-.95 4.1-1.05', 'pf'],
    ['M16 5.75a2.25 2.25 0 1 0 4.5 0a2.25 2.25 0 1 0 -4.5 0', 'sf'],
  ],
  schema: [
    ['M9.75 4.5C7.95 4.5 7 5.45 7 7.25v2.1c0 1.35-.85 2.25-2.5 2.65 1.65.4 2.5 1.3 2.5 2.65v2.1c0 1.8.95 2.75 2.75 2.75', 'pf'],
    ['M14.25 4.5c1.8 0 2.75.95 2.75 2.75v2.1c0 1.35.85 2.25 2.5 2.65-1.65.4-2.5 1.3-2.5 2.65v2.1c0 1.8-.95 2.75-2.75 2.75', 'sf'],
  ],
  site: [
    ['M5.5 4.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1 -2 2h-13a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2z', 'pf'],
    ['M3.5 9h17M6.25 6.75h.01M8.75 6.75h.01', 'pf'],
    ['M12 11.75l-2.6 4.75h5.2L12 11.75z', 'sf'],
  ],
  views: [
    ['M5 4.25h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1z', 'pf'],
    ['M5 10h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1z', 'pf'],
    ['M5 15.75h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1z', 'pf'],
    ['M11.5 6.25H20M11.5 12H20M11.5 17.75H20', 'sf'],
  ],
}
