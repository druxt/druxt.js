// The Nuxt DevTools tab's page. It is for development only: the dev server serves it, and no build has it.

/** Where the dev server serves the tab's page. */
export const DRUXT_DEVTOOLS_ROUTE = '/__druxt/devtools'

/**
 * Where the dev server serves the tab's icon.
 *
 * It is a path, because Nuxt DevTools shows an image only from a path or a URL.
 */
export const DRUXT_DEVTOOLS_ICON_ROUTE = `${DRUXT_DEVTOOLS_ROUTE}/icon.svg`

/**
 * The Druxt tab, as core registers it with Nuxt DevTools.
 *
 * The tab shows the page in a frame, and its icon is the icon's route. It is in the `app` category, which is Nuxt
 * DevTools' default. A site with many tabs finds it in the overflow menu until it pins it.
 */
export const devtoolsTab = () => ({
  name: 'druxt',
  title: 'Druxt',
  icon: DRUXT_DEVTOOLS_ICON_ROUTE,
  category: 'app' as const,
  view: { type: 'iframe' as const, src: DRUXT_DEVTOOLS_ROUTE },
})

/**
 * The script the tab's page runs.
 *
 * Nuxt DevTools gives a custom tab's frame its client as `window.__NUXT_DEVTOOLS__`. That is the bridge
 * `@nuxt/devtools-kit/iframe-client` reads, and its `host.nuxt` is the app.
 *
 * The app's development plugin provides `$druxtDevtools`. It has the channel, and the function that defines
 * `<druxt-devtools>` in this frame's window.
 *
 * The section is kept in the frame's URL, so a reload returns to it. The theme follows DevTools' colour mode.
 */
const script = `
(() => {
  const tag = 'druxt-devtools'
  let element
  let client
  const sections = ['missing', 'quiet', 'modules', 'requests', 'settings']
  const theme = (value) => {
    const mode = value && value.devtools && value.devtools.colorMode
    if (element && (mode === 'dark' || mode === 'light')) element.setAttribute('theme', mode)
  }
  const mount = (value) => {
    const host = value && value.host && value.host.nuxt && value.host.nuxt.$druxtDevtools
    if (!host) return
    if (!element) {
      host.define(window)
      element = document.createElement(tag)
      const section = location.hash.slice(1)
      if (sections.includes(section) || section.startsWith('x-')) element.setAttribute('section', section)
      element.createEndpoint = host.createEndpoint
      element.openInEditor = host.openInEditor
      element.addEventListener('druxt-devtools-section', (event) => history.replaceState(null, '', '#' + event.detail.section))
      document.getElementById('waiting').remove()
      document.body.append(element)
      if (value.host.hooks) value.host.hooks.hook('host:update:reactivity', () => theme(client))
    }
    element.connect(host.channel)
    theme(value)
  }
  const current = window.__NUXT_DEVTOOLS__
  Object.defineProperty(window, '__NUXT_DEVTOOLS__', {
    configurable: true,
    get: () => client,
    set: (value) => { client = value; mount(value) },
  })
  if (current) window.__NUXT_DEVTOOLS__ = current
})()
`

/** The tab's page. It mounts the element once DevTools connects the frame to the app. */
export const devtoolsPage = (): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Druxt</title>
<style>html, body { margin: 0; height: 100%; } body { font: 13px/1.45 system-ui, sans-serif; } druxt-devtools { height: 100vh; } #waiting { padding: 20px; }</style>
</head>
<body>
<p id="waiting">Waiting for the app. Open this from the Druxt tab in Nuxt DevTools.</p>
<script>${script}</script>
</body>
</html>
`

/** What core uses of `@druxt/devtools` at build time. */
interface DruxtToolsPackage {
  druxtTabIconSvg: () => string
}

/** What core uses of `@nuxt/devtools-kit`. */
interface DevtoolsKitPackage {
  addCustomTab: (tab: ReturnType<typeof devtoolsTab>, nuxt?: never) => void
}

/** The optional development tools that were found. Each is undefined or false when it is not installed. */
export interface DruxtTools {
  /** `@druxt/devtools`: the model, the element and the console summary. */
  druxt?: DruxtToolsPackage
  /** `@nuxt/devtools-kit`: the Nuxt DevTools tab. */
  kit?: DevtoolsKitPackage
  /** Whether `@vue/devtools-api` is installed, for Vue DevTools. */
  vue: boolean
}

/** Where `loadDruxtTools()` reports. It is Nuxt's logger. */
interface ToolsLogger {
  error: (...args: unknown[]) => void
}

/**
 * Gets the specifier a failed import could not find, or `undefined` for any other failure.
 *
 * Two loaders report a missing package:
 *
 * - Node's native loader throws `ERR_MODULE_NOT_FOUND`, with "Cannot find package '<name>' imported from <importer>".
 * - jiti, which loads a module in development, throws `MODULE_NOT_FOUND`, with "Cannot find module '<name>'".
 *
 * The importer is not read. It names the package itself when what is missing is one of the package's own dependencies.
 *
 * @param error - What the import threw.
 * @returns The specifier, or `undefined`.
 * @internal
 */
export const missingSpecifier = (error: unknown): string | undefined => {
  const { code, message } = (error || {}) as { code?: string, message?: unknown }
  if (code !== 'ERR_MODULE_NOT_FOUND' && code !== 'MODULE_NOT_FOUND') return undefined
  return /^Cannot find (?:package|module) '([^']+)'/.exec(String(message))?.[1]
}

/**
 * Imports the optional development tools.
 *
 * A package that is not installed is skipped. Any other failure to load a package is logged as an error, and that
 * package is skipped too.
 *
 * @param importer - Imports a package by name: `(name) => import(name)`, or a stand-in in a test.
 * @param logger - Where a failure is logged.
 * @returns The packages found.
 */
export const loadDruxtTools = async (importer: (name: string) => Promise<unknown>, logger: ToolsLogger): Promise<DruxtTools> => {
  const load = async <T>(name: string): Promise<T | undefined> => {
    try {
      return await importer(name) as T
    } catch (error) {
      // A package that is not installed is the one failure that is expected. A package that is installed but fails to
      // load is worth an error. That includes one whose own dependency is missing.
      if (missingSpecifier(error) !== name) logger.error(`${name} could not be loaded:`, error)
      return undefined
    }
  }
  const [druxt, kit, vue] = await Promise.all([load<DruxtToolsPackage>('@druxt/devtools'), load<DevtoolsKitPackage>('@nuxt/devtools-kit'), load('@vue/devtools-api')])
  return { druxt, kit, vue: !!vue }
}

/**
 * Writes what development says about the tools that are missing.
 *
 * When `@druxt/devtools` is missing, that is one line. Otherwise there is one line for each package that Nuxt DevTools
 * in the app would use but that is missing.
 *
 * @param tools - The packages found.
 * @param nuxtDevtools - Whether Nuxt DevTools is in the app.
 * @returns The lines to log at info level.
 */
export const missingToolsMessages = (tools: DruxtTools, nuxtDevtools: boolean): string[] => {
  if (!tools.druxt) return ['Add @druxt/devtools as a dev dependency for the Druxt tab in Nuxt DevTools, Vue DevTools and the console summary.']
  if (!nuxtDevtools) return []
  return [
    ...(tools.kit ? [] : ['Add @nuxt/devtools-kit as a dev dependency for the Druxt tab in Nuxt DevTools.']),
    ...(tools.vue ? [] : ['Add @vue/devtools-api as a dev dependency for the Druxt inspector and timeline in Vue DevTools.']),
  ]
}
