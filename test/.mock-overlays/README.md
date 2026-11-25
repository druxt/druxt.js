<!-- The router port restores the full wording, with the router's /es standalone tests. -->

# Overlay

The Umami preset publishes the stock site, as released modules answer it. An
overlay is a recording of the same site with one change, kept as the difference
from that baseline, and a consumer that needs one keeps its own copy.

`language-routing-patches.json.gz` is this repository's. It records
[Decoupled Router #3111456](https://www.drupal.org/i/3111456) and
[Druxt #3273228](https://www.drupal.org/i/3273228), neither of which is in a
release. It comes from
[decoupled-drupal-mock](https://github.com/Decipher/decoupled-drupal-mock)'s
`examples/overlays/`, and its SHA-256 is
`c0cf8e2d2323a981ea53bf6703672f3fac6be678f9ff823457ee15d00c72089f`, which is
what that repository's own `manifest.json` records for it. It was recorded
against the preset's 1.0.0-alpha.3 build, and every UUID in the preset changed
at alpha.3, so an overlay from another build names resources the preset does
not have.

Nothing in this tree loads the overlay yet. The standalone suite here holds one
check, that `/jsonapi` answers JSON:API at `DRUXT_BASE_URL`: the examples/drupal
backend the CI job provisions, or the mock a merge request's Try it section
starts, `decoupled-drupal-mock-umami@alpha`.

The standalone `/es` tests that assert what a patched Decoupled Router answers
arrive with the module ports: router, menu, breadcrumb, blocks and site. They
need this overlay against the mock, and the mock must then send
`Content-Language` as well, which is an open issue on the mock. Until then the
file is kept here so those ports find it.

Replace it by rebuilding from a Drupal with the two patches applied, as the
mock's `docs/overlays.md` describes. Nothing here is edited by hand.

## views-recipes-difficulty

`views-recipes-difficulty.json.gz` records one View change, for the views
filter tests.
No View in the preset has an exposed filter an anonymous visitor can use, so
nothing else lets those tests run a filter through to Drupal and back.

The change is to the `recipes` view's default display, which its `page_1`
display inherits:

- An exposed filter on the Difficulty field, `field_difficulty_value`, with the
  identifier `difficulty`, the label "Difficulty", one value at a time, and
  "- Any -". Umami's recipes are 4 easy and 6 medium, with no hard ones.
- Four recipes to a page instead of 12, so the medium recipes span two pages.

`views.view.recipes.yml` is the View as the site exported it, and
`views-recipes-difficulty.queries.txt` lists the requests the build sent on
top of the preset's own `oracle.txt`.

The mock's build records each View's routes without a query string, so the
filtered and paged answers are in the overlay's oracle,
`oracle/views-recipes-difficulty.json.gz`, rather than in the overlay itself.
`test/drupal.js` answers those requests from the oracle, as Drupal answered
them, and `test/mockOverlays.test.js` replays the rest of the oracle against the
preset with this overlay.

Its SHA-256 is
`6020a8a5a178ff90db167117fde6669fe3dbce48946062430242f13e6ea050af`, and its
oracle's is
`a5bc9ecbdbaf68d17968c3dab1e08da59f6a3759117aa9beeac5b8690d79b7bc`, as the
overlay tool's `manifest.json` recorded them. It was recorded against the
preset's 1.0.0-alpha.3 build, from a site stood up with the mock's own
`presets/umami/site.sh`, with the View change applied and the preset's
`build.json` less its `writesFile`.

To record it again, stand up that site, import `views.view.recipes.yml`, build
with the preset's `oracle.txt` and the queries file appended, and run
`yarn overlay` against the preset's dump, as the mock's `docs/overlays.md`
describes.

A preset rebuild gives every resource a new UUID. Keep a copy of the old dump
before updating the preset, then move the overlay onto the new one from the
mock's checkout with `yarn overlay realign <old dump> <new dump>
views-recipes-difficulty <dir>`, which moves the oracle with it. That changes
UUIDs and install times only and records nothing new, so compare the result with
a fresh recording and record the overlay again where they differ.
