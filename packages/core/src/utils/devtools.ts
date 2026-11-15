// The Nuxt DevTools tab's page. Development only: the dev server serves it, and no build has it.

/** Where the dev server serves the tab's page. */
export const DRUXT_DEVTOOLS_ROUTE = '/__druxt/devtools'

/** Where the dev server serves the tab's icon: a path, as Nuxt DevTools shows an image only from a path or a URL. */
export const DRUXT_DEVTOOLS_ICON_ROUTE = `${DRUXT_DEVTOOLS_ROUTE}/icon.svg`

/**
 * The Druxt tab, as core registers it with Nuxt DevTools: the page in a frame, under the icon's route. In the `app`
 * category, Nuxt DevTools' default, where a site with many tabs finds it in the overflow menu until it pins it.
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
 * Nuxt DevTools gives a custom tab's frame its client as `window.__NUXT_DEVTOOLS__`, the bridge
 * `@nuxt/devtools-kit/iframe-client` reads, whose `host.nuxt` is the app. The app's development plugin provides
 * `$druxtDevtools`: the channel, and the function that defines `<druxt-devtools>` in this frame's window. The section
 * is kept in the frame's URL, so a reload returns to it, and the theme follows DevTools' colour mode.
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
      if (sections.includes(section)) element.setAttribute('section', section)
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

/** The tab's page: the element, mounted once DevTools connects the frame to the app. */
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

/** The optional development tools found, each undefined or false when it is not installed. */
export interface DruxtTools {
  /** `@druxt/devtools`: the model, the element and the console summary. */
  druxt?: DruxtToolsPackage
  /** `@nuxt/devtools-kit`: the Nuxt DevTools tab. */
  kit?: DevtoolsKitPackage
  /** Whether `@vue/devtools-api` is installed, for Vue DevTools. */
  vue: boolean
}

/** Where `loadDruxtTools()` reports: Nuxt's logger. */
interface ToolsLogger {
  error: (...args: unknown[]) => void
}

/**
 * The specifier a failed import could not find, or `undefined` for any other failure. Node's native loader throws
 * `ERR_MODULE_NOT_FOUND` with "Cannot find package '<name>' imported from <importer>", and jiti, which loads a module
 * in development, throws `MODULE_NOT_FOUND` with "Cannot find module '<name>'". The importer is left out, since it
 * names the package itself when what is missing is one of its own dependencies.
 *
 * @param error - What the import threw.
 * @internal
 */
export const missingSpecifier = (error: unknown): string | undefined => {
  const { code, message } = (error || {}) as { code?: string, message?: unknown }
  if (code !== 'ERR_MODULE_NOT_FOUND' && code !== 'MODULE_NOT_FOUND') return undefined
  return /^Cannot find (?:package|module) '([^']+)'/.exec(String(message))?.[1]
}

/**
 * Imports the optional development tools. A package that is not installed is skipped. Any other failure to load one is
 * logged as an error, and that package is skipped too.
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
      // Not installed: the one failure that is expected. A package that is installed but fails is worth an error, a
      // dependency of it that is missing included.
      if (missingSpecifier(error) !== name) logger.error(`${name} could not be loaded:`, error)
      return undefined
    }
  }
  const [druxt, kit, vue] = await Promise.all([load<DruxtToolsPackage>('@druxt/devtools'), load<DevtoolsKitPackage>('@nuxt/devtools-kit'), load('@vue/devtools-api')])
  return { druxt, kit, vue: !!vue }
}

/**
 * What development says about the tools that are missing: one line for `@druxt/devtools`, else one each for what
 * Nuxt DevTools in the app would use but cannot.
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
