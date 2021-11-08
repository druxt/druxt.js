---
"druxt": minor
---

Added ability to proxy the Drupal file system

```js
export default {
  druxt: {
    proxy: {
      files: 'default'
    }
  }
}
```

Creates a proxy entry:
- `/sites/${PATH}/files` -> `${BASEURL}/site/${PATH}/files`
