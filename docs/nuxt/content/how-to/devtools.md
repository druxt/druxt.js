---
title: Debug Druxt with the Vue Devtools
weight: -2
description: 'The DruxtJS devtools inspector shows connection details and live theme suggestions, and scaffolds wrapper components in one click.'
---

> **Before you start:** this guide assumes a working Druxt site running
> in development mode (`nuxt dev`); the integration does not load in
> production builds. See [Getting started](/tutorials/getting-started).

![Vue.js Devtools showing the DruxtJS integration](/images/vuejs-devtools.png)

Druxt registers a plugin with the
[Vue.js Devtools](https://devtools.vuejs.org) that turns the browser
extension into a theming companion. Every Druxt component on the page
shows which wrapper it resolved and which names it would have accepted,
with a scaffold action on each.

## Install

1. [Install the Vue.js Devtools](https://devtools.vuejs.org/getting-started/installation.html)
   browser extension.
2. Run your site with `nuxt dev` and open the devtools panel. A
   **DruxtJS** inspector appears alongside the standard Vue panes.

## The DruxtJS inspector

The inspector's **Connection details** node shows the `baseUrl` and
`endpoint` the site is configured with, and the JSON:API address they
combine into. When a page renders nothing, this is the two-second check
that the frontend points at the backend you think it does.

## Theme suggestions on every component

Select any Druxt component in the standard component inspector and its
state gains a `$theme` entry holding the wrapper it resolved, above the
ordered list of component names it tried. This is the live version of
the suggestion chain that
[Component resolution](/explanation/component-resolution) describes,
and Druxt components are easy to spot in the tree, tagged `druxt` in
blue.

## Scaffold a wrapper from the browser

Each unregistered name in the `$theme` list carries a save action.
Clicking it asks the dev server to create that wrapper file, at its
suggestion path with the component's props and slots stubbed in, and
open it in your editor. The scaffolding runs through a dev-mode server
endpoint (`/_druxt/template/add`) that exists only under `nuxt dev`.

Inspect the component whose markup you want to own and click the
suggestion that fits. The file appears, ready to edit, and the
[theming guide](/how-to/theming) covers what to put in it.

## Where to go next

- [Theme Druxt components](/how-to/theming): what to do with the
  wrapper you just scaffolded.
- [Component resolution](/explanation/component-resolution): the rules
  behind the `$theme` list.
- [Browse components in Storybook](/how-to/storybook): the other
  workshop view of the same suggestion system.
