---
'druxt-entity': patch
---

fix(#1020): fields with the same name in different entities on one page no longer share fetched data. Before, a field rendered in another component's slot could pick up another entity's data, so an edit form's field could show the display formatter instead of its widget.
