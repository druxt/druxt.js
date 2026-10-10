import fs from 'fs'
import path from 'path'
import semver from 'semver'

// The axios constraint is spread across every published package, and #929 was
// the three of them disagreeing: druxt asked for exactly 0.28.0 while
// druxt-blocks and druxt-views depended on exactly 0.33.0, so no install could
// satisfy both. A per-package test cannot see that, so read them together.
const root = path.resolve(__dirname, '../../..')

const manifests = fs
  .readdirSync(path.join(root, 'packages'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(root, 'packages', entry.name, 'package.json'))
  .filter((file) => fs.existsSync(file))
  .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')))
  .filter((manifest) => manifest.private !== true)

const constraints = (name) =>
  manifests
    .flatMap((manifest) =>
      ['dependencies', 'peerDependencies', 'optionalDependencies'].map((section) => ({
        pkg: manifest.name,
        section,
        range: (manifest[section] || {})[name]
      }))
    )
    .filter((entry) => entry.range)

describe('Published axios constraints', () => {
  test('every published package asks for axios in a satisfiable way', () => {
    // Expect:
    // - at least one version of axios to satisfy all of them at once.
    const declared = constraints('axios')
    expect(declared.length).toBeGreaterThan(0)

    // The lowest version each comparator set admits, taken from every declared
    // range. A disjunctive range contributes each of its arms, so `>=1 || >=5`
    // offers 1 and 5 rather than whichever came first.
    const candidates = declared
      .flatMap((entry) => new semver.Range(entry.range).set)
      .map((set) => semver.minVersion(set.join(' ')))
      .filter(Boolean)
      .map((version) => version.version)
    const satisfies = (version) => declared.every((entry) => semver.satisfies(version, entry.range))

    // `declared` sits in the compared value on purpose. jest ignores a second
    // argument to `toBe`, so a bare assertion fails with "Expected: true,
    // Received: false" and says nothing about which packages disagreed.
    const described = declared.map((entry) => `${entry.pkg} (${entry.section}: ${entry.range})`).join(', ')
    expect({ satisfiable: candidates.some(satisfies), declared: described }).toEqual({
      satisfiable: true,
      declared: described
    })
  })

  test('the druxt peer range admits the axios the workspace installs', () => {
    // Expect:
    // - the installed axios to satisfy what druxt declares, so the contract
    //   cannot drift away from the version the tests actually run against.
    const range = manifests.find((manifest) => manifest.name === 'druxt').peerDependencies.axios
    const installed = JSON.parse(fs.readFileSync(require.resolve('axios/package.json'), 'utf8')).version
    expect(semver.satisfies(installed, range)).toBe(true)
  })

  test('the druxt peer range keeps its floor below the CVE-era releases', () => {
    // Expect:
    // - 0.27.2 and earlier refused, since the floor is 0.28.0 (#704).
    const range = manifests.find((manifest) => manifest.name === 'druxt').peerDependencies.axios
    expect(semver.satisfies('0.27.2', range)).toBe(false)
    expect(semver.satisfies('0.28.0', range)).toBe(true)
  })
})
