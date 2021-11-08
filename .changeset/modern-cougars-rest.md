---
"druxt": minor
---

Added ability to proxy the API

```js
export default {
  druxt: {
    proxy: {
      api: true
    }
  }
}
```

Creates two proxy entries:
- The JSON:API: `${ENDPOINT}` -> `${BASEURL}${ENDPOINT}`
- The Decoupled Router:`/router/translate-path` -> `${BASEURL}/router/translate-path`
