---
"druxt-entity": minor
---

Added **include** option and the ability to filter related resources.

```js
export default {
  druxt: {
    query: {
      include: ['field_media_image', 'field_media_image.field_media_image'],
      fields: [
        ['file--file', ['uri']],
        ['media--image', []]
      ],
    }
  }
}
```
