---
'druxt-entity': patch
'druxt-schema': patch
---

fix(#836): in development, an entity whose display settings fail to load now says why. druxt-entity's `DruxtEntity` used to show "Missing display settings" for every failure, so an error such as a 403 looked like a display that was never configured.

The panel now names the resource type and the mode, such as `'node--page' in the 'teaser' view mode`, and shows the error when the display exists but couldn't be loaded. Nothing changes in production.
