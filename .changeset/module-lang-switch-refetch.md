---
'druxt': patch
'druxt-blocks': patch
'druxt-entity': patch
'druxt-menu': patch
'druxt-views': patch
---

fix(#940): a view, entity, block or menu shows the new language after a client-side language switch, even when the switch comes while the previous fetch is still running.

The previous language's result is dropped when it arrives after the switch, rather than shown until the new language loads.

Sites that carry a patch adding a `lang` watcher to `DruxtView` (druxt-views) or `DruxtEntity` (druxt-entity) can drop it.
