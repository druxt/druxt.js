---
title: Entity
---

> Drupal Display Mode powered Entity, Form and Field Druxt components.

## Components

### \<DruxtEntity /\>

Renders a Drupal Content Entity by JSON:API resource type, UUID, view mode and schema type.

Fields are rendered as Druxt Field components, based on the Drupal display mode configuration.

```vue
<DruxtEntity :type="resourceType" :uuid="uuid" :mode="displayMode" />
```

![Example DruxtEntity component](/images/druxt-entity.png)

Get started with the [Guide](/guide/entity) and [API Documentation](/api/packages/entity/components/DruxtEntity).


### \<DruxtEntityForm /\>

Renders a Drupal Content Entity form with submission and validation support.

```vue
<DruxtEntityForm :type="resourceType" :mode="displayMode" />
```

![Example DruxtEntityForm component](/images/druxt-entity-form.png)

Get started with the [Guide](/guide/entity) and [API Documentation](/api/packages/entity/components/DruxtEntityForm).