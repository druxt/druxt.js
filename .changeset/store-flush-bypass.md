---
'druxt': patch
---

`druxt/flushCollection` and `druxt/flushResource` now remove what they name, accept a type with a prefix, take the collection's `query` in place of its `hash`, and do nothing for data that was never stored. Before, some combinations did nothing, an unknown type threw, and a flushed resource read with `include` threw.

`druxt/getResource` with `bypassCache` now fetches every requested field and returns only the included resources in the fresh response.
