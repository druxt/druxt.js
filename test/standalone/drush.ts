import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const command = (process.env.DRUXT_DRUSH || `${root}examples/drupal/vendor/bin/drush -r ${root}examples/drupal/web`).split(' ')

/** Whether Drush for the example backend is available to the standalone tests. */
export const hasDrush = existsSync(command[0]!)

/**
 * Runs a Drush command against the example backend and returns its output.
 *
 * @param args - The Drush command and its arguments.
 */
export const drush = (args: string[]): string => execFileSync(command[0]!, [...command.slice(1), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

/**
 * The value of one key of a configuration object, as Drush prints it.
 *
 * @param name - The configuration object.
 * @param key - The key within it.
 */
export const configGet = (name: string, key: string): string => {
  const output = drush(['config:get', name, key])
  // Drush prints `'name:key': value`; the value may itself hold `': '`.
  const at = output.indexOf(': ')
  if (at === -1) throw new Error(`drush config:get printed no value for ${name}:${key}: ${output}`)
  return output.slice(at + 2).trim().replace(/^'|'$/g, '')
}
