# Deprecations

## DruxtField default components

> [druxt-entity] The `*` component is deprecated.

**Version:** `>= 0.16.0`

The default DruxtField components were deprecated in version `0.16.0` and will be removed in a future release.

They are no longer imported by default (`entity.components.fields`
defaults to `false`), so a current site carries
no deprecated field components unless it opts back in:

```js
module.exports = {
  druxt: {
    entity: {
      components: {
        fields: true, // Temporary, while migrating away from the defaults.
      },
    },
  },
};
```
