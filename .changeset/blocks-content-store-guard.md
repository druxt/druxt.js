---
'druxt-blocks': patch
---

A block content block whose resource is not in the store, or was flushed from it, renders nothing instead of throwing during render. It threw whenever the store lacked the entry, so a cache clear while the block was on the page emptied it for good.
