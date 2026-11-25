// The module names already reported, so each is logged once per process.
//
// Names can come from CMS data, so the set stops growing at a limit. A name past the limit is still logged, each
// time it is seen.
const reported = new Set<string>()
const LIMIT = 100

/**
 * Reports a `<Druxt module>` name that no registered component answers, once per name.
 *
 * In production the page renders nothing for such a name, so the server log is the only place a typo shows.
 *
 * @param module - The name `<Druxt>` was given, such as `not-a-real-module`.
 * @param component - The component it looked for, such as `DruxtNotARealModule`.
 * @param warn - Where to log.
 * @internal
 */
export const reportUnknownModule = (module: string, component: string, warn: (message: string) => void): void => {
  if (reported.has(module)) return
  if (reported.size < LIMIT) reported.add(module)
  warn(`No Druxt module named '${module}': ${component} is not registered.`)
}
