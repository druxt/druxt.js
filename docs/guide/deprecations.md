# Deprecations


## DruxtField default components

> [druxt-entity] The `*` component is deprecated.

**Version:** `>= 0.16.0`

The default DruxtField components were deprecated in version `0.16.0` and will be removed in a future release.

The components can be tree shaken with the following setting in `nuxt.config.js`:

```js
module.exports = {
  druxt: {
    entity: {
      components: {
        fields: false,
      },
    },
  },
}
```
