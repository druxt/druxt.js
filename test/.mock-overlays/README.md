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
