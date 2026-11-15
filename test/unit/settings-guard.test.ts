import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../', import.meta.url))

/** Files that may read the raw public config, and why. */
const PUBLIC_CONFIG_ALLOWED: Record<string, string> = {
  'packages/core/src/runtime/settings.ts': 'resolves useDruxtSettings() from the public config',
  'packages/core/src/runtime/plugins/druxt.ts': 'builds the client options for each side',
  'packages/core/src/runtime/server/settings.ts': 'resolves useDruxtServerSettings()',
  'packages/core/src/runtime/server/client.ts': 'builds the server client options',
  'packages/core/src/runtime/server/routes/token.ts': 'reads the client options to sign in',
  'packages/core/src/runtime/server/routes/proxy.ts': 'reads the base URL to proxy to, for each request',
  'packages/core/src/runtime/server/utils/session.ts': 'reads whether the server holds the session, and the site URL its cookies follow',
  'packages/core/src/runtime/files.ts': 'reads the base URL, the files URL and the files proxy, to resolve file URLs',
  'packages/core/src/runtime/plugins/origin.server.ts': 'reads the base URL to leave it out of a rendered page',
  'packages/core/src/runtime/server/plugins/origin.ts': 'reads the base URL to take it out of a page with no server render',
}

/** The raw public config, and a `settings` object carried on the client. */
const PATTERNS: Array<{ name: string, test: RegExp, allowed: Record<string, string> }> = [
  { name: 'public.druxt', test: /public\??\.druxt\b/, allowed: PUBLIC_CONFIG_ALLOWED },
  { name: '$druxt.settings', test: /\$druxt\??\.settings\b|\.settings!/, allowed: {} },
]

/** The offending lines of a source file, as `name:line`. */
const violations = (file: string, source: string): string[] => {
  const found: string[] = []
  source.split('\n').forEach((text, index) => {
    for (const { name, test, allowed } of PATTERNS) {
      if (test.test(text) && !(file in allowed)) found.push(`${file}:${index + 1} ${name}`)
    }
  })
  return found
}

/** Every package that has a runtime, so a package ported later is covered without an edit here. */
const runtimes = (): string[] => readdirSync(join(root, 'packages'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(root, 'packages', entry.name, 'src/runtime')))
  .map((entry) => join(root, 'packages', entry.name, 'src/runtime'))

const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const path = join(dir, entry.name)
  if (entry.isDirectory()) return walk(path)
  return /\.(?:ts|vue)$/.test(entry.name) ? [path] : []
})

describe('the settings guard', () => {
  it('finds a read of the raw public config or of $druxt.settings', () => {
    expect(violations('packages/router/src/runtime/x.ts', 'const a = useRuntimeConfig().public.druxt')).toHaveLength(1)
    expect(violations('packages/router/src/runtime/x.ts', 'const a = nuxtApp.$druxt.settings')).toHaveLength(1)
    expect(violations('packages/router/src/runtime/x.ts', 'const a = this.$druxt.settings!.router')).toHaveLength(1)
    expect(violations('packages/core/src/runtime/settings.ts', 'config.public.druxt')).toEqual([])
  })

  it('keeps every module runtime off the raw public config and the client settings', () => {
    const files = runtimes().flatMap((dir) => walk(dir))
    // A walk that finds nothing would pass for the wrong reason.
    expect(files.length).toBeGreaterThan(0)
    const found = files.flatMap((path) => violations(relative(root, path), readFileSync(path, 'utf8')))
    expect(found).toEqual([])
  })
})
