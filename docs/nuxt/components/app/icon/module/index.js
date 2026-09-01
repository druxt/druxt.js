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

/**
 * The icon component for a module package.
 *
 * @param {string} pkg - The package directory name, e.g. 'entity'.
 * @returns {object} The icon component; the core mark covers unknown packages.
 */
export const moduleIcon = (pkg) => moduleIcons[pkg] || Druxt
