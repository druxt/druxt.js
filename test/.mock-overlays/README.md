# Overlay

The Umami preset publishes the stock site, as released modules answer it. An
overlay is a recording of the same site with one change, kept as the difference
from that baseline, and a consumer that needs one carries its own copy.

`language-routing-patches.json.gz` is this repository's:
[Decoupled Router #3111456](https://www.drupal.org/i/3111456) and
[Druxt #3273228](https://www.drupal.org/i/3273228), neither of which is in a
release. It comes from
[decoupled-drupal-mock](https://github.com/Decipher/decoupled-drupal-mock)'s
`examples/overlays/`, and its SHA-256 is
`2549aa9e245a089cc0d6e557e05cb858406842676c1b71e1bae07f5211ee6aa9`, which is
what that repository's own `manifest.json` records for it.

It is not optional decoration. Stock Decoupled Router answers the front page
without a langcode, and `getRedirect` reads that field as a URL prefix, so the
redirect middleware test passes against the stock preset and fails against this
overlay. The overlay is the only thing in the suite that makes the defect fail
rather than hide.

Replace it by rebuilding from a Drupal that carries the two patches, as the
mock's `docs/overlays.md` describes. Nothing here is edited by hand.
