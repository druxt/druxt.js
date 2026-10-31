---
'druxt': patch
---

Fix a browser tab locking up when a wrapper emits `input` from a watcher on its `entity` prop, a pattern that worked on 0.24.

Since 0.25.0 a module rebuilds its wrapper's props when they change, and a value the wrapper emits comes back to it as `entity`. For a resource fetched without `include`, every one of those echoes counted as a change, so the wrapper and the module fed each other until the tab ran out of memory. An echo that matches what the wrapper already has now leaves it alone.

A wrapper that kept its own copy of `entity` to work around this can drop it.
