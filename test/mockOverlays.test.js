// Replays what the recorded site answered against the preset with this
// repository's overlays, as decoupled-drupal-mock's docs/overlays.md shows. A
// failure means the overlay misses something the site does.
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { gunzipSync } from 'zlib'

import { stringify } from 'qs'

const { comparable, loadPreset } = require('decoupled-drupal-mock/jest')

const { baseUrl, drupal } = require('./drupal')

// The overlay alone on the preset, as it was recorded: the suite's own engine
// also carries the language-routing overlay, which changes the router's answers.
const recipesDifficulty = loadPreset('umami', { overlays: [resolve(__dirname, '.mock-overlays/views-recipes-difficulty.json.gz')] })

// The queried recipes requests are answered from this same oracle, by the
// extension in test/drupal.js, so replaying them would compare the oracle with
// itself. The last test holds the suite's engine, extension and all, to one.
const isServedFromOracle = ({ request }) => /^(\/en)?\/jsonapi\/views\/recipes\/[^/?]+\?/.test(request)

// The mock answers a route with no language prefix from the default language's
// recording, links and all, so its links name /en where Drupal's do not. That
// is the mock's, not the overlay's, and its views tests read the data alone.
const isUnprefixedView = ({ request }) => request === '/jsonapi/views/recipes/page_1'

const oracle = (name) => JSON.parse(gunzipSync(readFileSync(resolve(__dirname, '.mock-overlays/oracle', `${name}.json.gz`))))

describe('views-recipes-difficulty overlay', () => {
  const answers = oracle('views-recipes-difficulty').filter((entry) => !isServedFromOracle(entry) && !isUnprefixedView(entry))

  test.each(answers.map((entry) => [entry.request, entry]))('%s', (_request, entry) => {
    const answer = recipesDifficulty.handle('GET', entry.request)
    expect(answer.status).toBe(entry.status)
    // `comparable` sets aside what Drupal salts afresh on every answer.
    if (typeof entry.body !== 'string') expect(comparable(answer.body)).toEqual(comparable(entry.body))
  })

  test('answers a filtered recipes query', () => {
    const request = `/en/jsonapi/views/recipes/page_1?${stringify({ 'views-filter': { difficulty: 'easy' } })}`
    const answer = drupal.handle('GET', request)
    expect(answer.status).toBe(200)
    expect(answer.body.data.map(({ attributes }) => attributes.field_difficulty)).toStrictEqual(['easy', 'easy', 'easy', 'easy'])
    expect(answer.body.links.self.href).toBe(`${baseUrl}${request}`)
  })
})
