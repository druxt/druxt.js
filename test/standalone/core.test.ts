import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { useTestContext } from '@nuxt/test-utils/e2e'
import { standalone } from './standalone'

/** Every file under a directory, by path. */
const files = (dir: string): string[] => readdirSync(dir, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => join(entry.parentPath, entry.name))

standalone('core', '/', ['Borscht with pork ribs'], () => {
  // The development stylesheet and the tools' markup stay out of a production build, browser and server alike.
  it('builds no development stylesheet or tool markup into production', () => {
    const output = useTestContext().nuxt!.options.nitro.output!.dir!
    const built = files(output).filter((file) => /\.(?:css|m?js)$/.test(file))
    const sources = built.map((file) => [file, readFileSync(file, 'utf8')] as const)
    // The scan reads the components' chunks: DruxtDebug, which production keeps, is among them.
    expect(sources.some(([file, source]) => file.includes('/public/') && source.includes('druxt-debug'))).toBe(true)
    for (const [file, source] of sources) {
      expect(source.includes('--druxt-'), file).toBe(false)
      expect(source.includes('druxt-devel'), file).toBe(false)
      if (file.endsWith('.css')) {
        expect(source.includes('.druxt-'), file).toBe(false)
        // The field and entity defaults are development's too: production lists keep the browser's bullets.
        expect(source.includes('druxt-field__items'), file).toBe(false)
      }
      // DruxtDebug's folding JSON view is development's: production prints plain JSON.
      if (file.includes('/public/')) expect(source.includes('DruxtDebugJson') || source.includes('druxt-debug__fold'), file).toBe(false)
    }
  })

  // The development tools are development's alone: no custom element, no DevTools tab route, no model, no Vue DevTools plugin.
  it('builds none of the development tools into production', () => {
    const output = useTestContext().nuxt!.options.nitro.output!.dir!
    const sources = files(output).filter((file) => /\.(?:m?js|json|html)$/.test(file)).map((file) => [file, readFileSync(file, 'utf8')] as const)
    // The scan reads the app's chunks: DruxtDebug, which production keeps, is among them.
    expect(sources.some(([, source]) => source.includes('druxt-debug'))).toBe(true)
    for (const [file, source] of sources) {
      for (const marker of ['druxt-devtools', '/__druxt/devtools', 'module:missing', 'Druxt requests', '$druxtDevtools', 'druxt:devtools:requests', 'module:note']) {
        expect(source.includes(marker), `${marker} in ${file}`).toBe(false)
      }
    }
  })
})
