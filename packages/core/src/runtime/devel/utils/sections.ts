import type { DruxtDevtoolsChannel } from '@druxt/devtools'
import type { DruxtDevtoolsBlock } from '../types'

// The sections modules added through `useDruxtDevtools()`, and the page clock for their events.
//
// This file is internal. No public entry point exports it, so core's public types never name the optional
// `@druxt/devtools` package.

/** A module section's label and data provider. */
export type SectionProvider = { label: string, provider: () => DruxtDevtoolsBlock[] }

// The sections modules added, by id. They are read again on each refresh. The map is created on first use.
let providers: Map<string, SectionProvider> | undefined
// The page's start on the browser's clock, for the timeline's events.
let origin = 0

/**
 * Sets where the page started on the browser's clock, for the timeline's events.
 *
 * Core's development plugin calls it on each navigation.
 *
 * @param value - The page's start, from `performance.now()`.
 * @internal
 */
export const setDevtoolsOrigin = (value: number): void => {
  origin = value
}

/** Reads a section's data and shows it. A provider that throws shows its error in place of its data. */
export const showSection = (channel: DruxtDevtoolsChannel, id: string, { label, provider }: SectionProvider): void => {
  let blocks: DruxtDevtoolsBlock[]
  try {
    blocks = provider()
  } catch (error) {
    blocks = [{ type: 'pairs', items: { error: (error as Error)?.message || String(error) } }]
  }
  channel.emit({ type: 'section', section: { id, label, blocks } })
}

/**
 * Reads every module section's data again.
 *
 * Core's development plugin calls it on each page, and as modules report.
 *
 * @param channel - The development tools' channel.
 * @internal
 */
export const refreshDevtoolsSections = (channel: DruxtDevtoolsChannel): void => {
  for (const [id, entry] of providers || []) showSection(channel, id, entry)
}

/** The module sections, by id. Only in development, in the browser. */
export const sectionProviders = (): Map<string, SectionProvider> => (providers ||= new Map())

/** The time now on the page's clock, in milliseconds, for a timeline event. */
export const devtoolsTime = (): number => performance.now() - origin
