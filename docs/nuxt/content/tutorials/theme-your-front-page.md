---
title: Theme your front page
weight: -8
description: Take over the front page view and its teasers with two wrapper components, and learn the naming rule the whole Druxt theme layer runs on.
---

Your Druxt site's front page is a Drupal View rendering node teasers.
Both are currently drawn by Druxt's plain fallback output. In this tutorial
you replace them with two components of your own, one for the listing and
one for each teaser. No framework code gets touched.

By the end you will have written those two files and learned the rule that
decides which file Druxt picks up. That rule is the whole of Druxt
theming.

## Prerequisites

- A running Druxt site from
  [Getting started with Druxt](/tutorials/getting-started), with
  `npm run dev` up.
- **At least two published articles promoted to the front page.** Create
  them the way Getting started did (**Content → Add content → Article**),
  and on each one open **Promotion options** in the sidebar and tick
  **Promoted to front page**. Add an image to one of them.

Nothing else. You will not install anything or change any configuration.

**Outcome:** http://localhost:3000 shows your articles' images and body
text, one after another, and **no titles**. That is not a bug, and it is a
useful thing to understand before you theme anything: Drupal's article
teaser display lists the image and the trimmed body, and nothing else. The
heading you'd see on a Drupal site comes from Drupal's own node template,
which a decoupled frontend does not have. Putting the title back is your
job now, and Step 3 does it.

## Step 1: Find out what is rendering the page

Before theming something, name it. Ask the backend what the front path
resolves to:

```sh
curl "$BASE_URL/router/translate-path?path=/"
```

(`$BASE_URL` is in your project's `.env`. On the quickstart it holds
`http://127.0.0.1:8888`.)

**Outcome:** the response names a view. Abridged, the parts that matter
are:

```json
{
  "resolved": "http://127.0.0.1:8888/node",
  "isHomePath": true,
  "view": { "view_id": "frontpage", "display_id": "page_1" },
  "jsonapi": { "resourceName": "view--view" }
}
```

So the front page is Drupal's **`frontpage`** view, display **`page_1`**.
Druxt renders it with `DruxtView`, and the view's row configuration decides
what each result looks like: `frontpage` renders nodes in the **`teaser`**
display mode, so each row is a `DruxtEntity` in `teaser` mode.

The listing and the teaser are the two things to theme.

## Step 2: Write the listing component

Create this file:

```vue
<!-- nuxt/components/druxt/view/frontpage/Page1.vue -->
<template>
  <div class="frontpage">
    <h1>Latest posts</h1>

    <div class="frontpage__grid">
      <slot name="results" />
    </div>

    <slot name="pager" />
  </div>
</template>

<script>
export default {};
</script>
```

Save it. Registration, imports and configuration are all handled by the
file's location.

**Outcome:** reload http://localhost:3000 and the listing now has your
"Latest posts" heading above the articles.

The path did that. Nuxt turns every file under `components/` into a
component named after its path, so
`components/druxt/view/frontpage/Page1.vue` becomes
**`DruxtViewFrontpage`**`Page1`, and that is exactly the name `DruxtView`
looks for when it renders the `frontpage` view's `page_1` display. The
file's location does the wiring.

The `results` and `pager` slots are the view's own output, handed to you to
place. A view wrapper is also given `header`, `filters`, `sorts`,
`attachments_before` and `attachments_after`; a slot with nothing behind it
renders nothing, so you only place the ones you want.

## Step 3: Write the teaser component

Same idea, one level down. Each result is a node in the `teaser` display
mode:

```vue
<!-- nuxt/components/druxt/entity/node/article/Teaser.vue -->
<template>
  <article class="teaser">
    <slot name="field_image" />

    <h2 v-text="entity.attributes.title" />

    <slot name="body" />
  </article>
</template>

<script>
export default {
  props: {
    entity: { type: Object, required: true },
  },
};
</script>
```

**Outcome:** each article is now your `<article class="teaser">`, with the
image above the title and the trimmed body below it. The titles are back,
read straight off the entity rather than waiting for a field slot.

`components/druxt/entity/node/article/Teaser.vue` is
`DruxtEntityNodeArticleTeaser`: entity type `node`, bundle `article`, view
mode `teaser`. The **slot names are the field names** from Drupal's teaser
display for that bundle, so `field_image` and `body` are there because the
article teaser display shows them. Change the display in Drupal and the
slots change with it.

> The image works because Druxt proxies Drupal's files directory through
> your frontend by default. On a static build there is no proxy at runtime,
> so read [Proxy the Drupal backend through Nuxt](/how-to/proxy) before you
> deploy.

## Step 4: Declare your props

Look at your teaser in the browser's element inspector:

```html
<article fields="[object Object]" schema="[object Object]" value="[object Object]" class="teaser">
```

Druxt hands a wrapper a set of props. Anything you don't declare falls
through to `$attrs`, and Vue writes `$attrs` onto your root element, so
undeclared props become literal `[object Object]` attributes in the markup.

Declare them yourself, or take the module's mixin, which covers the whole
set:

```vue
<script>
import { DruxtEntityMixin } from 'druxt-entity';

export default {
  mixins: [DruxtEntityMixin],
};
</script>
```

**Outcome:** reload, and the element is `<article class="teaser">`. Only
your own class remains.

`druxt-views` provides the equivalent for view wrappers as
`DruxtViewsViewMixin`, which declares `count`, `display`, `langcode`,
`mode`, `pager`, `results` and `view`.

## Step 5: Narrow the teaser's JSON:API request

A wrapper can narrow the JSON:API request its own component makes. Add a
`druxt` block to the teaser:

```vue
<script>
import { DruxtEntityMixin } from 'druxt-entity';

export default {
  mixins: [DruxtEntityMixin],

  druxt: {
    query: {
      fields: ['title'],
    },
  },
};
</script>
```

**Outcome:** the titles are still there and the image and body have
vanished. You asked Drupal for one field, so that is all the component has,
and the slots for the fields you didn't request render nothing.

Put back what the template actually uses:

```js
fields: ['title', 'body', 'field_image'],
```

**Outcome:** image, title and body are all back.

This is worth remembering as a symptom, not just a feature: **an empty
field slot usually means a `fields` list that doesn't include it**. The
same block also takes `include` for relationship data, which the
[example apps](/how-to/example-apps) use to pull media and taxonomy terms
into a card.

## Step 6: Theme more than one thing at a time

The name you choose decides how wide the net is. Drop a level off either
file name and it covers more:

| File | Component | Themes |
| --- | --- | --- |
| `druxt/entity/node/article/Teaser.vue` | `DruxtEntityNodeArticleTeaser` | article teasers |
| `druxt/entity/node/Teaser.vue` | `DruxtEntityNodeTeaser` | every node type's teaser |
| `druxt/entity/Teaser.vue` | `DruxtEntityTeaser` | every entity's teaser |
| `druxt/view/frontpage/Page1.vue` | `DruxtViewFrontpagePage1` | this one display |
| `druxt/view/Frontpage.vue` | `DruxtViewFrontpage` | every display of the view |

Try it: rename `article/Teaser.vue` up to `node/Teaser.vue` and your
teaser still renders, now for every content type. Rename it back and the
article-specific file wins again, because **the most specific name that
exists is the one Druxt uses**. Use a general wrapper for your project
style, then add a specific one as an exception. The exception takes over
the moment you save it.

> A **new** wrapper file appears on the next page load. A **renamed** one
> sometimes doesn't, because the dev server's component index is built from
> what it saw at startup. If a rename seems to be ignored, restart
> `npm run dev`.

## What you've got

Your two files, and the rule behind them:

```text
nuxt/components/druxt/
├── entity/node/article/Teaser.vue   → DruxtEntityNodeArticleTeaser
└── view/frontpage/Page1.vue         → DruxtViewFrontpagePage1
```

- The path is the component name, and the component name is the wiring.
- Slots are the module's output: results and pager for a view, one per
  field for an entity.
- Undeclared props are written into your markup as attributes. A mixin
  declares them for you.
- A wrapper's `druxt.query` decides what its component fetches.
- The most specific matching name wins, so you can theme broadly and then
  make exceptions.

Nothing here is specific to the front page. Every Druxt component on your
site (blocks, menus, breadcrumbs, fields, forms) is themed exactly this
way.

## Where to go next

- [Theme Druxt components](/how-to/theming): the reference version of this,
  including the default-template alternative to wrapper files and the
  dev-mode box that scaffolds a wrapper for you.
- [Component resolution](/explanation/component-resolution): the full
  candidate list and how the ranking is built.
- [Debug Druxt with the Vue Devtools](/how-to/devtools): read
  `component.options` to see every name a component would accept.
- [Explore the example apps](/how-to/example-apps): finished wrapper sets
  for Tailwind, DaisyUI and BootstrapVue.
- [Building a custom Druxt module](/tutorials/first-custom-module): the
  same system from the other side, as the author of a themeable component.
- [Deploy your site](/tutorials/deploy-your-site): put the themed site on a
  live URL.
