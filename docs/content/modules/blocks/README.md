---
title: Blocks
description: Drupal Block and Block Region Druxt components.
---

## Components

### \<DruxtBlock /\>

Renders a Drupal Block by UUID or Drupal's internal ID.

```vue
<DruxtBlock :id="drupal_internal__id" />
```

```vue
<DruxtBlock :uuid="uuid" />
```

Get started with the [Guide](/guide/blocks) and [API Documentation](/api/packages/blocks/components/DruxtBlock).



### \<DruxtBlockRegion /\>

Renders all visible blocks by theme and region name.

Additional, non-visible blocks are available as slots and props data.

```vue
<DruxtBlockRegion :name="name" :theme="theme" />
```

![Example DruxtBlockRegion component](/images/druxt-block-region.png)

Get started with the [Guide](/guide/blocks) and [API Documentation](/api/packages/blocks/components/DruxtBlockRegion).
