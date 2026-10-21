---
'druxt': patch
---

perf(#843): `DruxtClient` instances on the same Axios instance, base URL, endpoint and resource config share one JSON:API index fetch.
