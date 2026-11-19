---
'druxt-entity': patch
---

fix(#1020): a field rendered in another component's slot finds its entity for its fetch key. Before, fields with the same name on one page could share fetched data, so an edit form's field could render the view's formatter instead of its widget.
