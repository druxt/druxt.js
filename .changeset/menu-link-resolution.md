---
'druxt-menu': patch
---

Menu items now link by their URL, not by their Drupal route name.

A path that only the Nuxt frontend serves, such as `/api`, renders as a
`<nuxt-link>` instead of an `<a>` that reloads the page. `<nolink>`, `<none>`
and `<button>` items render their title as text in a `<span>`. With
`menu.jsonApiMenuItems: false`, links use `link.resolvable_uri` from Drupal
11.4 and later instead of rendering `entity:` URIs as broken links; older
cores link to the system path, such as `/node/33`. Absolute URLs on the Drupal
host or the frontend host use the frontend router, and Drupal files stay plain
links.

Check any menu link to a path on the Drupal host that the frontend does not
resolve, such as a raw admin or authentication path: it now renders as a
`<nuxt-link>` too, and 404s in the frontend instead of reaching Drupal. There
is no per-link opt-out. Give the frontend a route for that path, or move the
link out of the menu, to keep it working.

Custom menu wrappers can apply the same rules with the new `getMenuLinkUrl`
and `resolveMenuLink` exports:

```js
import { getMenuLinkUrl, resolveMenuLink } from 'druxt-menu';

const url = getMenuLinkUrl(item.entity.attributes);
const { to, href } = resolveMenuLink(url, { baseUrl, frontendUrl });
```
