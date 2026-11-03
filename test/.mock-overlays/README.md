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
`2549aa9e245a089cc0d6e557e05cb858406842676c1b71e1bae07f5211ee6aa9`, which is
what that repository's own `manifest.json` records for it.

The file is not decoration. Stock Decoupled Router leaves the langcode out of
the front page's answer, so the redirect middleware test used to expect `/` for
a request to `/en/node`: with no langcode there was no prefix to redirect to.
Against this overlay the langcode is there, and the answer is `/en`, which is
what `packages/router/test/router.test.js` pins for every path but the home
path itself. So the overlay is what makes the suite assert the behaviour a
patched Decoupled Router actually produces, rather than the behaviour that
happens to hold while the field is absent.

Replace it by rebuilding from a Drupal with the two patches applied, as the
mock's `docs/overlays.md` describes. Nothing here is edited by hand.
