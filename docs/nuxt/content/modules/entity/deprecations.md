---
title: Deprecations
---

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

### What replaces them

Field rendering is intended to be handled by **your own theme components**,
resolved per field via the
[component suggestion system](/explanation/component-resolution):

1. **Field wrapper components**: DruxtField generates candidates from the
   field's formatter and field name, most specific first, e.g. for an
   `image` formatter on `field_image`:

   ```text
   DruxtFieldImageFieldImage   (formatter + field name)
   DruxtFieldImage             (formatter only, same name as the deprecated default)
   ```

   Create the file, and auto-discovery does the rest:
   `components/druxt/field/Image.vue` (all image fields) or
   `components/druxt/field/image/FieldImage.vue` (one field). The wrapper
   receives `value`, `schema` (including formatter `settings`),
   `relationship` and `errors` as props:

   ```vue
   <!-- components/druxt/field/Image.vue -->
   <template>
     <img :src="value.url" :alt="value.alt || schema.label.text" />
   </template>

   <script>
   export default {
     props: {
       value: { type: [Object, Array], default: undefined },
       schema: { type: Object, default: undefined },
     },
   };
   </script>
   ```

2. **Slot rendering**: render the entity yourself and place fields
   directly, as covered in the [theming guide](/how-to/theming):

   ```vue
   <DruxtEntity type="node--article" :uuid="uuid">
     <template #default="{ entity }">
       <article>
         <h1>{{ entity.attributes.title }}</h1>
       </article>
     </template>
   </DruxtEntity>
   ```

3. **Keep the defaults for now**: the deprecated components still render,
   since deprecation just marks them for future removal. Tree-shake them
   only when your own components cover the fields in use.

The [custom module tutorial](/tutorials/first-custom-module) covers the
suggestion-system mechanics from scratch.
