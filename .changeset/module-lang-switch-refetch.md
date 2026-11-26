---
'druxt': patch
---

fix(#940): a view, entity, block or menu shows the new language after a client-side language switch, even when the switch comes while the previous fetch is still running.

Sites that carry a patch adding a `lang` watcher to `DruxtView` or `DruxtEntity` can drop it.
