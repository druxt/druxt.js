---
'druxt': patch
---

fix(#966): a `DruxtClient` created with only its base URL argument strips the backend host from the JSON:API index's links, as passing `baseUrl` in the options did. Requests follow the Axios `baseURL` or the proxy, where they went straight to the backend.

Sites that passed `baseUrl` in both places can drop the option.
