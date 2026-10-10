---
'druxt-blocks': patch
---

A `DruxtBlockBlockContent` block renders nothing while the store has no resource for it, where it threw. A cache clear with the block on the page no longer breaks the page.
