---
'druxt': patch
---

The JSON:API index is now shared between DruxtClient instances that use the same Axios instance for the same base URL, endpoint and resource config. Multiple Druxt modules in one process fetch the index once instead of once per client, concurrent requests share the one fetch, and a client with its own Axios instance, and so its own credentials, keeps its own index.
