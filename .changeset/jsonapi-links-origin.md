---
'druxt': patch
---

fix(#833): links in the JSON:API index reach the browser as paths, even when Drupal builds them with a different scheme or host from `baseUrl`, such as `https://` behind a proxy. Before, a client-side navigation could then call the backend's host directly.
