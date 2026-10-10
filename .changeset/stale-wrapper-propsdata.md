---
'druxt': patch
---

A module rebuilds its wrapper's props when its own props change, without fetching again, so a reused `DruxtField` given a form schema renders the form.
