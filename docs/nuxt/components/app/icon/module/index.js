import Blocks from './Blocks.vue'
import Breadcrumb from './Breadcrumb.vue'
import Druxt from './Druxt.vue'
import Entity from './Entity.vue'
import Menu from './Menu.vue'
import Router from './Router.vue'
import Schema from './Schema.vue'
import Site from './Site.vue'
import Views from './Views.vue'

/** Per-module icon components, keyed by package directory name. */
export const moduleIcons = {
  blocks: Blocks,
  breadcrumb: Breadcrumb,
  druxt: Druxt,
  entity: Entity,
  menu: Menu,
  router: Router,
  schema: Schema,
  site: Site,
  views: Views,
}

/** The package directory names that count as modules. */
export const modulePkgs = Object.keys(moduleIcons)

/**
 * The npm package name for a module directory.
 *
 * @param {string} pkg - The package directory name, e.g. 'entity'.
 * @returns {string} The npm name; the core package is plain `druxt`.
 */
export const moduleName = (pkg) => (pkg === 'druxt' ? 'druxt' : 'druxt-' + pkg)

/** Filenames whose route is their containing directory, per lib/content-index. */
const INDEX_SEGMENTS = ['index', 'README']

/**
 * Whether a route is a module package's root page, where the layout's module
 * header carries the page's own title and source link: `/modules/<pkg>` and
 * `/api/packages/<pkg>`. The page components read this to skip a header that
 * would otherwise print the module identity a second time.
 *
 * @param {string} path - The route path.
 * @returns {boolean} True on a covered package's root page.
 */
export const isPackageRoot = (path) => {
  // Every empty segment dropped, not just the leading and trailing ones: a
  // `//` inside a path leaves a '' between the parts, and '' is falsy, so a
  // positional guard reads `/api/packages/entity//CHANGELOG` as having no
  // fourth segment and calls it a package root.
  const segments = path.split('/').filter(Boolean)

  // A package root is reachable at a second URL: the sitemap lists the
  // collapsed path, but the source filename resolves too, so
  // `/modules/<pkg>/README` and `/api/packages/<pkg>/index` are the same
  // pages as `/modules/<pkg>` and `/api/packages/<pkg>`. The rule has to
  // reach both, or the longer URL prints the module identity twice.
  if (INDEX_SEGMENTS.includes(segments[segments.length - 1])) segments.pop()

  // Counted, not probed positionally: the original asked whether a later
  // segment was truthy, which is the question that let '' through.
  const [first, second, third] = segments
  if (segments.length === 2 && first === 'modules') return modulePkgs.includes(second)

  return segments.length === 3 && first === 'api' && second === 'packages' && modulePkgs.includes(third)
}

/**
 * The icon component for a module package.
 *
 * @param {string} pkg - The package directory name, e.g. 'entity'.
 * @returns {object} The icon component; the core mark covers unknown packages.
 */
export const moduleIcon = (pkg) => moduleIcons[pkg] || Druxt
