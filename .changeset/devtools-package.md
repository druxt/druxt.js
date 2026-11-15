---
'@druxt/devtools': major
---

feat(#980)!: add `@druxt/devtools`, the development tools with no Vue, Nuxt or h3 dependency. A model holds what a page's Druxt modules did, and the `<druxt-devtools>` custom element and a console summary show it. Druxt's Nuxt module embeds the element in a Nuxt DevTools tab and feeds Vue DevTools from the model. A site adds it as a dev dependency. A server render's request carries the `page` it was made for, which the Requests section names.

A request has `partial`, Drupal's reason when it omitted resources from the response, and the Requests section marks it.

The element keeps a list's scroll position as events arrive, and starts each source it is connected to with that source's actions idle. The function `registerAction()` returns withdraws its own registration only, so an action registered again under the same id stays. The console's grouped summary prints again when a quiet error's status or detail changes.
