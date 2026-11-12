// The Druxt mark, from druxtjs.org's logo: three paths. Never redrawn.

/** The mark's three paths: blue, green, then ink. */
export const DRUXT_MARK_PATHS = [
  'M139 330l-1-2c-2-4-2-8-1-13H29L189 31l67 121 22-16-67-121c-1-2-9-14-22-14-6 0-15 2-22 15L5 303c-1 3-8 16-2 27 4 6 10 12 24 12h136c-14 0-21-6-24-12z',
  'M447 304L317 70c-2-2-9-15-22-15-6 0-15 3-22 15l-17 28v54l39-67 129 230h-49a23 23 0 0 1-2 14l-1 1c-6 11-21 12-23 12h76c3 0 17-1 24-12 3-5 5-14-2-26z',
  'M376 330v-1l1-2c1-4 2-8 1-12l-4-12-102-178-15-27h-1l-15 27-102 178-4 12a24 24 0 0 0 2 15c4 6 10 12 24 12h190c3 0 18-1 25-12zM256 152l93 163H163l93-163z',
] as const

/** The mark's width over its height. */
export const DRUXT_MARK_RATIO = 452 / 342

/**
 * The mono mark, one colour, as SVG source.
 *
 * @param size - The width in pixels: 16 or 20 for a tab icon.
 * @param fill - The colour, `currentColor` unless given.
 */
export const druxtMonoMark = (size = 16, fill = 'currentColor'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 452 342" width="${size}" height="${Math.round(size / DRUXT_MARK_RATIO)}" fill="${fill}" aria-hidden="true">${DRUXT_MARK_PATHS.map((d) => `<path d="${d}"/>`).join('')}</svg>`

/**
 * The tab icon as SVG source, for a DevTools rail that shows an image: the rail's grey, lighter in a dark scheme. Nuxt
 * DevTools shows an image only from a URL that starts with `/` or `http`, so core serves this from a route of its own.
 */
export const druxtTabIconSvg = (): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 452 342"><style>path{fill:#4a5560}@media (prefers-color-scheme:dark){path{fill:#a9b6c1}}</style>${DRUXT_MARK_PATHS.map((d) => `<path d="${d}"/>`).join('')}</svg>`

/**
 * The tab icon as a data URL, for a rail that takes one.
 */
export const druxtTabIcon = (): string => `data:image/svg+xml,${encodeURIComponent(druxtTabIconSvg())}`
