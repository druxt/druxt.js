import type { DruxtDevtoolsChannel, DruxtDevtoolsModule } from '@druxt/devtools'

// Core's side of the development tools: the channel that `@druxt/devtools` creates and core's development plugin
// sets.
//
// This file is internal. No public entry point exports it, so core's public types never name the optional package.

let channel: DruxtDevtoolsChannel | undefined

/**
 * The development tools' channel.
 *
 * The registry reports to it. Nuxt DevTools, Vue DevTools and the console summary read from it.
 *
 * It is undefined until core's development plugin sets it. It stays undefined without `@druxt/devtools` installed,
 * and outside development. Every report is dropped then.
 */
export const druxtDevtools = (): DruxtDevtoolsChannel | undefined => channel

/**
 * Sets the development tools' channel, and runs the tasks that waited for it.
 *
 * Core's development plugin calls it, with `@druxt/devtools` installed.
 *
 * @param value - The channel, from `createDruxtDevtools()`.
 * @internal
 */
export const setDruxtDevtools = (value: DruxtDevtoolsChannel | undefined): void => {
  channel = value
  if (value) for (const task of waiting.splice(0)) task(value)
}

// The tasks that ran before the channel was set, such as a module's plugin adding its section. They run once it is
// set. The list is bounded, for an app without the tools installed, where the channel is never set.
const waiting: ((channel: DruxtDevtoolsChannel) => void)[] = []

/**
 * Runs a task against the development tools' channel: now, or once core's development plugin sets the channel.
 *
 * @param task - The task.
 * @internal
 */
export const whenDruxtDevtools = (task: (channel: DruxtDevtoolsChannel) => void): void => {
  if (channel) task(channel)
  else if (waiting.length < 200) waiting.push(task)
}

/**
 * Reports a module to the development tools, once it resolves, fails or changes.
 *
 * @param module - The module, as the tools show it.
 */
export const reportModule = (module: DruxtDevtoolsModule): void => {
  druxtDevtools()?.emit({ type: module.status === 'default' ? 'module:missing' : 'module:resolved', module })
}

/**
 * Drops a module from the development tools, once it is gone.
 *
 * @param id - The module instance's id.
 */
export const removeModule = (id: string): void => {
  druxtDevtools()?.emit({ type: 'module:removed', id })
}
