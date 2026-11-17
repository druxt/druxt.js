// @druxt/core/runtime: what a Druxt module is built from.

// The module composable, its context, and the props and events every module shares.
export { useDruxtModule } from './useDruxtModule'
export type { DruxtModuleContract, DruxtModulePayload } from './useDruxtModule'
export { DRUXT_MODULE, DRUXT_QUIET, useDruxtModuleContext } from './context'
export type { DruxtModuleContext } from './context'
export { druxtModuleEmits, druxtModuleProps } from './props'
export type { DruxtModuleProps, WrapperOption } from './props'

// The wrapper candidates a module's name and options give.
export { getModuleComponents } from './candidates'
export type { ComponentCandidate } from './candidates'

// The development tools.
export { useDruxtDevtools } from './devel/api'
export type { DruxtDevtoolsAction, DruxtDevtoolsApi, DruxtDevtoolsBlock, DruxtDevtoolsSectionHandle } from './devel/api'

// What the default output is rendered with: classes, anchors, file URLs and links.
export { defineDruxtClasses, useDruxtClasses } from './classes'
export { useDruxtAnchors } from './anchors'
export { useDruxtFileUrl } from './files'
export { druxtLink } from './link'

// The page's title and the site's languages.
export { DRUXT_PAGE_TITLE_STATE, useDruxtPageTitle } from './page'
export type { DruxtPageTitle } from './page'
export { DRUXT_LANGUAGES_STATE, useDruxtLanguages } from './languages'
export type { DruxtSiteLanguage, UseDruxtLanguages } from './languages'
