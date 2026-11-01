---
'druxt': patch
---

fix(#973): a wrapper component that emits `input` from a watcher on its `entity` prop no longer freezes the browser tab. This worked on 0.24 and broke in 0.25.0.

Since 0.25.0, a Druxt module such as `DruxtEntity` rebuilds its wrapper's props when they change, and the value the wrapper emits comes back to it as `entity`. For a resource fetched without `include`, each round trip counted as a change, so the wrapper and the module updated each other until the tab ran out of memory. A value that matches what the wrapper already has no longer counts as a change.
