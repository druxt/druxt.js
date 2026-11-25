// The development tools' types that a Druxt module uses. Core owns these copies, so core's public types never name
// the optional `@druxt/devtools` package. They match that package's own types: core's development plugin checks that
// each is assignable both ways.

/**
 * A note a module adds about itself, shown with the module.
 *
 * A module keeps one note per key. The key is the note's kind unless one is given.
 */
export interface DruxtDevtoolsNote {
  /** What the note is about, such as `layout-builder-fallback`. */
  kind: string
  /** The note's identity on its module. It is the note's kind unless given. */
  key?: string
  /** The note, in one line. */
  title: string
  /** More about it. */
  detail?: string
}

/**
 * A piece of a module's section, as data the tools render: a list of keys and values, a table, or a tree.
 *
 * A module never supplies markup.
 */
export type DruxtDevtoolsBlock =
  | { type: 'pairs', title?: string, items: Record<string, unknown> }
  | { type: 'table', title?: string, columns: string[], rows: unknown[][] }
  | { type: 'tree', title?: string, value: unknown }

/** A named action a module offers, such as clearing a cache. Its handler runs in the app. */
export interface DruxtDevtoolsAction {
  id: string
  label: string
  /** The section it shows in, by id. */
  section?: string
}
