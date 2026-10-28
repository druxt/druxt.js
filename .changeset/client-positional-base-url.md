---
'druxt': patch
---

Fix a `DruxtClient` created with only its base URL argument, which kept the backend host in every resource URL from the JSON:API index.

`new DruxtClient(baseUrl)` now uses the base URL for the index links, as passing `baseUrl` in the options did, so requests follow the Axios `baseURL` or the proxy. Sites that passed `baseUrl` in both places can drop the option.
