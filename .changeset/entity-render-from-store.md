---
'druxt-entity': minor
---

feat(#1019): an entity on the page now follows its resource in the store, so a save, a preview or anything else that stores a newer copy shows everywhere the entity renders, a view's rows included.

Unsaved edits stay on the entity that holds them, and nothing else on the page sees them until a save. They also stay when you flip `schemaType` between `form` and `view`, so the view shows them as a preview. A save or a Reset clears them. `dirty` on the component says whether there are any.

Each language keeps its own edits. After a switch to another language, the page shows that translation with any edits it has. The first language's edits come back when you switch back. A save writes the current language's edits to that translation only.

A wrapper's own changes to its props in view mode are now lost when the stored resource changes. Keep that state in the wrapper's own data.

After `druxt/clearCache`, a mounted entity keeps showing its content while it fetches again. If Drupal then refuses it, as after a sign-out, the entity shows its error state. Sites that fetched again or called `$forceUpdate()` after a save to update the page can remove that.
