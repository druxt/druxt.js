---
'druxt-entity': minor
---

feat(#1019): an entity on the page now follows its resource in the store, so a save, a preview or anything else that stores a newer copy shows everywhere the entity renders, a view's rows included.

Unsaved edits stay on the entity that holds them, and nothing else on the page sees them until a save. They also stay when you flip `schemaType` between `form` and `view`, so the view shows them as a preview. A save or a Reset clears them. `dirty` on the component says whether there are any, for an entity loaded by its `uuid`. An entity bound with `v-model` holds its parent's data and is never dirty, and neither is a form for a new entity before its first save.

Each language keeps its own edits. After a switch to another language, the page shows that translation with any edits it has. The first language's edits come back when you switch back. A save writes the current language's edits to that translation only.

After `druxt/clearCache`, a mounted entity keeps showing its content while it fetches again, which is one request for each entity on the page that isn't already loading. If Drupal then refuses it, as after a sign-out, the entity shows its error state, and it asks again on the next `druxt/clearCache`. Sites that fetched again or called `$forceUpdate()` after a save to update the page can remove that.

Upgrade notes for a site with its own wrapper components:

- A wrapper gets a new `entity` and `value` object when the stored entity changes. `DruxtEntityMixin`'s `model` follows it. A wrapper that keeps the object it first got holds a stale copy, so read the prop each time.
- A wrapper that changes its `entity` or `value` prop in place is editing the entity. The change counts as an unsaved edit, so the entity keeps it and stops following the store until a save or a Reset. Keep state that isn't an edit, such as an open panel, in the wrapper's own data.
- A parent listening for `input` on an entity with a `#default` template hears it once more for each change to the stored entity. A store write that changes nothing emits nothing.
- The component's `entity` property is now the stored entity, without unsaved edits, when the store holds it and no parent passes a `value`. Otherwise it is a copy of `model`, as before. Read `model` for the edited entity.
