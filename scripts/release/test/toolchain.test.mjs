import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { describe, it } from 'node:test'

const require = createRequire(import.meta.url)

/**
 * The changesets command has to start before it can do anything, and a
 * transitive dependency can stop it.
 *
 * human-id 4.2.0 added `type: module` with no exports map. @changesets/write
 * requires it from CommonJS, so `changeset version` died on ERR_REQUIRE_ESM
 * before it read a single changeset. #850 pinned 4.1.3 for that reason and
 * #922 bumped the pin, inside the `^4.1.1` range @changesets/write asks for.
 *
 * This spawns a separate process on purpose. Importing the module here would
 * prove nothing: the failure depends on the Node version doing the requiring,
 * and Node 22 and later load an ES module from `require` quite happily, so an
 * in-process check would pass on a newer Node while the release, which runs on
 * Node 16, still broke.
 */
describe('the changesets command line', () => {
  it('starts, which means every CommonJS require in its graph resolved', () => {
    const bin = require.resolve('@changesets/cli/bin.js')
    let failure
    try {
      execFileSync(process.execPath, [bin, '--version'], { stdio: 'pipe', encoding: 'utf8' })
    } catch (error) {
      failure = `${error.stderr || ''}${error.stdout || ''}`.trim() || error.message
    }
    assert.equal(failure, undefined, `\`changeset --version\` did not start:\n${failure}`)
  })
})
