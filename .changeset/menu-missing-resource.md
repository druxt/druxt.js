---
'druxt-menu': patch
---

A menu now renders empty instead of throwing `collection.data is not iterable` when the backend's JSON:API index has no `menu_link_content--menu_link_content` resource.
