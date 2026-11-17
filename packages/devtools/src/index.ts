// The entry file of @druxt/devtools. Nothing here needs Vue, Nuxt or h3, so any host can feed the model and embed the
// element.

// The model: the channel a host feeds, and the helpers that read it.
export { DRUXT_DEVTOOLS_SECTIONS, createDruxtDevtools, describeCandidate, groupMissing, noteKey, splitStatus } from './model'
export type {
  DruxtDevtoolsAction,
  DruxtDevtoolsBlock,
  DruxtDevtoolsChannel,
  DruxtDevtoolsEvent,
  DruxtDevtoolsListener,
  DruxtDevtoolsMissingEntry,
  DruxtDevtoolsMissingGroup,
  DruxtDevtoolsModule,
  DruxtDevtoolsNote,
  DruxtDevtoolsQuietError,
  DruxtDevtoolsQuietEvent,
  DruxtDevtoolsRequest,
  DruxtDevtoolsRequestKind,
  DruxtDevtoolsModuleSection,
  DruxtDevtoolsSection,
  DruxtDevtoolsSetting,
  DruxtDevtoolsSnapshot,
  DruxtDevtoolsStatus,
  DruxtDevtoolsTemplate,
  DruxtDevtoolsTier,
  DruxtDevtoolsTimelineEvent,
} from './model'

// The console summary.
export { sectionData, summaryCounts, watchDruxtDevtoolsSummary } from './summary'
export type { DruxtDevtoolsConsole, DruxtDevtoolsSummaryOptions } from './summary'

// The `<druxt-devtools>` element.
export { DRUXT_DEVTOOLS_SECTION_EVENT, DRUXT_DEVTOOLS_TAG, defineDruxtDevtoolsElement, moduleSectionKey } from './element'
export type { DruxtDevtoolsElement, DruxtDevtoolsSource } from './element'

// The Druxt mark, as SVG for a tab icon.
export { DRUXT_MARK_PATHS, druxtMonoMark, druxtTabIcon, druxtTabIconSvg } from './icon'
