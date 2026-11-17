import type { DruxtDevtoolsBlock, DruxtDevtoolsChannel, DruxtDevtoolsModuleSection, DruxtDevtoolsSnapshot } from './model'

/** Where the summary prints. It is the console by default. */
export type DruxtDevtoolsConsole = Pick<Console, 'info' | 'group' | 'groupCollapsed' | 'groupEnd' | 'log'>

/** How the console summary prints. */
export interface DruxtDevtoolsSummaryOptions {
  /**
   * The tool the developer opens, such as `Nuxt DevTools > Druxt`.
   *
   * When it is given, the summary is one line that points to the tool. Without it, each page prints a grouped summary
   * with the candidate names.
   */
  open?: string

  /** Where the summary prints. The default is `console`. */
  console?: DruxtDevtoolsConsole

  /** How long the page must stay quiet before the summary prints, in milliseconds. The default is 1000. */
  delay?: number
}

/** A count with its noun, such as `1 quiet error` or `2 quiet errors`. */
const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`

/**
 * Gets the counts in words, such as `4 defaults in use, 2 quiet errors`.
 *
 * The defaults are counted by entry, not by instance. An entry is one module component with one candidate list.
 *
 * @param snapshot - The tools' snapshot.
 * @returns The counts, or an empty string when there is nothing to report.
 */
export const summaryCounts = (snapshot: DruxtDevtoolsSnapshot): string => {
  const entries = snapshot.missing.reduce((sum, group) => sum + group.entries.length, 0)
  return [
    entries ? plural(entries, 'default in use', 'defaults in use') : '',
    snapshot.quiet.length ? plural(snapshot.quiet.length, 'quiet error', 'quiet errors') : '',
  ].filter(Boolean).join(', ')
}

/**
 * Gets a block as plain data for the console.
 *
 * - A `pairs` block gives its object of keys and values.
 * - A `table` block gives its rows, each as an object keyed by column.
 * - A `tree` block gives its value.
 */
const blockData = (block: DruxtDevtoolsBlock): unknown => {
  if (block.type === 'pairs') return block.items
  if (block.type === 'table') return block.rows.map((row) => Object.fromEntries(block.columns.map((column, index) => [column, row[index]])))
  return block.value
}

/**
 * Gets a module section's data for the console.
 *
 * A section with one block gives that block's data. A section with more gives an object with each block's data under
 * the block's title. A block without a title is under its position, counted from 1.
 *
 * @param section - The section.
 * @returns The data.
 */
export const sectionData = (section: Pick<DruxtDevtoolsModuleSection, 'blocks'>): unknown =>
  section.blocks.length === 1 ? blockData(section.blocks[0]!) : Object.fromEntries(section.blocks.map((block, index) => [block.title || String(index + 1), blockData(block)]))

/**
 * Prints what the tools would show to the console, once the page settles.
 *
 * With the `open` option, it prints one line, such as `Druxt: 4 defaults in use. Open Nuxt DevTools > Druxt.`. The
 * line prints again only when the counts change.
 *
 * Without the `open` option, it prints up to two groups for each page:
 *
 * - A collapsed group, `Druxt: 4 defaults in use on /path`. It holds each default's candidate names and the modules'
 *   sections.
 * - An open group, `Druxt: 2 quiet errors on /path`. It holds the quiet errors, and prints only when there are any.
 *
 * Nothing prints when there is nothing to report.
 *
 * @param channel - The channel to listen to.
 * @param options - The tool to point to, the console, and the delay.
 * @returns A function that stops the printing.
 */
export function watchDruxtDevtoolsSummary(channel: DruxtDevtoolsChannel, options: DruxtDevtoolsSummaryOptions = {}): () => void {
  const out = options.console || console
  let timer: ReturnType<typeof setTimeout> | undefined
  let printed = ''

  const print = (): void => {
    const snapshot = channel.snapshot()
    const counts = summaryCounts(snapshot)
    const sections = (snapshot.sections || []).filter((section) => section.blocks.length)

    // The signature decides whether to print again. The one line for a tool repeats only for a new count. A grouped
    // summary also repeats for a new page, for new section data, and for a quiet error that changed, because it prints
    // each error.
    const quiet = snapshot.quiet.map((error) => [error.component, error.status, error.detail])
    const signature = options.open ? counts : JSON.stringify([snapshot.page, counts, sections.map((section) => [section.label, section.blocks]), quiet])
    if (signature === printed) return
    printed = signature

    // Sections alone are nothing to report. They show in the tab and the inspector.
    if (!counts) return

    if (options.open) {
      out.info(`Druxt: ${counts}. Open ${options.open}.`)
      return
    }
    const on = snapshot.page ? ` on ${snapshot.page}` : ''
    const defaults = snapshot.missing.reduce((sum, group) => sum + group.entries.length, 0)

    // A default is Druxt working as designed, so the defaults' group is collapsed, and the modules' sections go in it.
    // A quiet error is worth a look, so the quiet errors' group is open.
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

  // Each event restarts the delay, so the summary prints once the page is quiet. These four event types change
  // nothing the summary reports, so they do not restart it.
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
