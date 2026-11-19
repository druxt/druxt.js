---
'druxt': patch
---

fix(#833): index links that Drupal's JSON:API builds on another scheme or host than `baseUrl`, such as `https://` behind TLS or a proxy, reach the browser as paths. Before, only links on the exact `baseUrl` were cut, so a client-side navigation could request the backend's own host.
