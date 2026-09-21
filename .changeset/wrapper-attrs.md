---
'druxt': minor
---

The default wrapper no longer renders the attributes it is handed. A module gives its wrapper its own attributes and every propsData key the wrapper does not declare, so the wrapper can read them. Rendering them as well repeated the module's attributes on a second element and wrote objects into the markup: an entity rendered `<div entity="[object Object]" fields="[object Object]" schema="[object Object]" value="[object Object]">`, and a block region rendered its whole region list as an attribute.

**This changes rendered markup, and some of those attributes were being used.** A block region rendered `name="page_title"` and `theme="umami"`, a site rendered its whole region list, and this repository's own end to end tests selected regions by `div[name="page_title"]` until this change moved them off it. Committed snapshots across druxt-entity and druxt-site recorded the old output and are updated here. Anything selecting on those attributes, in CSS, a test or a script, selects nothing now.

Set a class and target that. Vue puts it on the module itself, on a server rendered visit and after a click alike:

```vue
<DruxtBlockRegion :class="`region region-${region}`" v-bind="props[region]" />
```

```js
// Was: div[name="page_title"]
cy.get('.region-page_title');
```

The druxt-site example does this now, and its end to end tests read the class. `data-fetch-key` looks like an alternative and is not one: it is absent on some render paths, so a selector built on it passes in the browser and fails on a server rendered visit.

What is unchanged: a wrapper still reads all of it from `$attrs`, byte for byte. Data still travels the chain and is still read back off it. An attribute set on the module still reaches the markup, on the module's own element, where Vue puts a component's attributes.

An `id` set on a module also stops repeating down the chain. A module renders its children through the default wrapper's slot, and every attribute in that slot reaches the module below, so one `id` on a DruxtEntity reached its fields and rendered on three elements. It now stays on the module it was set on. The slot still gives every other attribute to the modules below, which is what that passthrough is for. DruxtModule already withholds `data-fetch-key` from the same slot, for the same reason.

To keep the old markup for a module, give it a wrapper component. A wrapper of your own keeps Vue's default, so the attributes and any propsData it does not declare render on its root as before:

```js
// components/druxt/entity/Default.vue
export default {
  // Nothing declared here renders as an attribute.
  props: { entity: { type: Object, default: () => ({}) } },
};
```

Note that replacing `DruxtWrapper` itself, by registering a component of that name, does not work: each module registers its own, and a local registration wins.
