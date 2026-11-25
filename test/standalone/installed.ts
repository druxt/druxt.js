import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Every file under a directory, by path. */
export const filesUnder = (dir: string): string[] => readdirSync(dir, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => join(entry.parentPath, entry.name))

/**
 * Installs Druxt's packages into a fixture as a site installs them: real directories in its node_modules holding what
 * each publishes (`package.json` and `dist`), not the workspace's symlinks. A bundler builds a symlinked workspace
 * package into its own output but keeps an installed one external, and Nitro then traces it into the output's
 * server/node_modules, where a deployment ships it. The packages must be built.
 *
 * @param fixture - The fixture's directory name under test/standalone/fixtures.
 * @param names - The package directory names under packages/.
 */
export const installPackages = (fixture: string, names: string[]): void => {
  const installed = fileURLToPath(new URL(`./fixtures/${fixture}/node_modules/@druxt`, import.meta.url))
  rmSync(installed, { recursive: true, force: true })
  for (const name of names) {
    const from = fileURLToPath(new URL(`../../packages/${name}`, import.meta.url))
    // Read and written, not copied: a copy keeps the source's mode, which this container's file system can garble.
    for (const file of [join(from, 'package.json'), ...filesUnder(join(from, 'dist'))]) {
      const to = join(installed, name, relative(from, file))
      mkdirSync(dirname(to), { recursive: true })
      writeFileSync(to, readFileSync(file))
    }
  }
}
