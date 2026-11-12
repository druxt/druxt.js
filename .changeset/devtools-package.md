---
'@druxt/devtools': major
---

feat(#980)!: add `@druxt/devtools`, the development tools with no Vue, Nuxt or h3 dependency. A model holds what a page's Druxt modules did, and the `<druxt-devtools>` custom element and a console summary show it. Druxt's Nuxt module embeds the element in a Nuxt DevTools tab and feeds Vue DevTools from the model. A site adds it as a dev dependency. A server render's request carries the `page` it was made for, which the Requests section names.

A request has `partial`, Drupal's reason when it omitted resources from the response, and the Requests section marks it.
