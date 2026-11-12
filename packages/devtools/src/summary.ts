import type { DruxtDevtoolsBlock, DruxtDevtoolsChannel, DruxtDevtoolsModuleSection, DruxtDevtoolsSnapshot } from './model'

/** Where the summary prints: the console by default. */
export type DruxtDevtoolsConsole = Pick<Console, 'info' | 'group' | 'groupCollapsed' | 'groupEnd' | 'log'>

/** How the console summary prints. */
export interface DruxtDevtoolsSummaryOptions {
  /**
   * The tool the developer opens, such as `Nuxt DevTools > Druxt`. Given, one line points to it. Without one, each page
   * prints a grouped summary with the candidate names.
   */
  open?: string
  /** Where it prints. */
  console?: DruxtDevtoolsConsole
  /** How long the page stays quiet before it prints, in milliseconds. */
  delay?: number
}

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`

/**
 * The counts in words, such as `4 defaults in use, 2 quiet errors`. Empty when there is nothing to report. Defaults
 * count entries, one per module and candidate list, not instances.
 *
 * @param snapshot - The tools' snapshot.
 */
export const summaryCounts = (snapshot: DruxtDevtoolsSnapshot): string => {
  const entries = snapshot.missing.reduce((sum, group) => sum + group.entries.length, 0)
  return [
    entries ? plural(entries, 'default in use', 'defaults in use') : '',
    snapshot.quiet.length ? plural(snapshot.quiet.length, 'quiet error', 'quiet errors') : '',
  ].filter(Boolean).join(', ')
}

/** A block as plain data for the console: a list's object, a table's rows as objects, or a tree's value. */
const blockData = (block: DruxtDevtoolsBlock): unknown => {
  if (block.type === 'pairs') return block.items
  if (block.type === 'table') return block.rows.map((row) => Object.fromEntries(block.columns.map((column, index) => [column, row[index]])))
  return block.value
}

/**
 * A module section's data for the console: its one block's, or each block's by title.
 *
 * @param section - The section.
 */
export const sectionData = (section: Pick<DruxtDevtoolsModuleSection, 'blocks'>): unknown =>
  section.blocks.length === 1 ? blockData(section.blocks[0]!) : Object.fromEntries(section.blocks.map((block, index) => [block.title || String(index + 1), blockData(block)]))

/**
 * Prints what the tools would show to the console, once the page settles.
 *
 * With a tool to open, it prints one line, such as `Druxt: 4 defaults in use. Open Nuxt DevTools > Druxt.`, again only
 * when the counts change. Without one, it prints per page a collapsed group, `Druxt: 4 defaults in use on /path`, with
 * each default's candidate names and the modules' sections, and, only when there are any, an open group of the quiet
 * errors, `Druxt: 2 quiet errors on /path`. Nothing prints when there is nothing to report.
 *
 * @param channel - The channel to listen to.
 * @param options - The tool to point to, the console, and the delay.
 * @returns The function that stops it.
 */
export function watchDruxtDevtoolsSummary(channel: DruxtDevtoolsChannel, options: DruxtDevtoolsSummaryOptions = {}): () => void {
  const out = options.console || console
  let timer: ReturnType<typeof setTimeout> | undefined
  let printed = ''

  const print = (): void => {
    const snapshot = channel.snapshot()
    const counts = summaryCounts(snapshot)
    const sections = (snapshot.sections || []).filter((section) => section.blocks.length)
    // A tool's line repeats only for a new count. A grouped summary repeats for a new page or new section data too.
    const signature = options.open ? counts : JSON.stringify([snapshot.page, counts, sections.map((section) => [section.label, section.blocks])])
    if (signature === printed) return
    printed = signature
    // Sections alone are not something to report: they show in the tab and the inspector.
    if (!counts) return
    if (options.open) {
      out.info(`Druxt: ${counts}. Open ${options.open}.`)
      return
    }
    const on = snapshot.page ? ` on ${snapshot.page}` : ''
    const defaults = snapshot.missing.reduce((sum, group) => sum + group.entries.length, 0)
    // Defaults are Druxt working as designed, so their group is collapsed, with the modules' sections. Quiet errors are
    // worth a look, so theirs is not.
    if (defaults) {
      out.groupCollapsed(`Druxt: ${plural(defaults, 'default in use', 'defaults in use')}${on}`)
      for (const group of snapshot.missing) {
        for (const entry of group.entries) {
          out.log(`${entry.component}${entry.meta ? ` (${entry.meta})` : ''} ×${entry.count} rendered Druxt's default. Looked for, most specific first: ${entry.candidates.join(', ')}`)
        }
      }
      for (const section of sections) out.log(`${section.label}:`, sectionData(section))
      out.groupEnd()
    }
    if (snapshot.quiet.length) {
      out.group(`Druxt: ${plural(snapshot.quiet.length, 'quiet error', 'quiet errors')}${on}`)
      for (const error of snapshot.quiet) out.log(`${error.component} failed quietly: ${[error.status, error.detail].filter(Boolean).join(' ')}`)
      out.groupEnd()
    }
  }

  const unsubscribe = channel.subscribe((event) => {
    if (event.type === 'request' || event.type === 'settings' || event.type === 'module:restored' || event.type === 'timeline') return
    clearTimeout(timer)
    timer = setTimeout(print, options.delay ?? 1000)
  })
  return () => {
    clearTimeout(timer)
    unsubscribe()
  }
}
