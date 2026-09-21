---
'druxt': patch
---

A module now rebuilds its wrapper's propsData when its own props change. Before, `propsData` was built once inside `fetch()`, and Nuxt 2 does not re-run `fetch()` for a prop change, so a component instance Vue reused across one kept whatever it was first given. A `DruxtField` re-rendered with a form schema went on rendering the read-only view output, with no label, textarea or editor.

The rebuild reuses the props already in hand rather than fetching again, so no extra request is made. An errored module keeps its debug output, and a rebuild that would change nothing is skipped. Where JSON cannot hold a value exactly, such as a callback or a Set, identity decides rather than the JSON text, so two different values are never read as one.
