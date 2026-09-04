<a href="https://druxtjs.org">
  <img src=".github/banner.svg" alt="DruxtJS: The Fully Decoupled Drupal Framework">
</a>

# DruxtJS

[![npm](https://badgen.net/npm/v/druxt)](https://www.npmjs.com/package/druxt)
[![CI](https://github.com/druxt/druxt.js/actions/workflows/ci.yml/badge.svg)](https://github.com/druxt/druxt.js/actions/workflows/ci.yml)
[![Cypress](https://img.shields.io/endpoint?url=https://dashboard.cypress.io/badge/simple/w4vd6v/develop&style=flat&logo=cypress)](https://dashboard.cypress.io/projects/w4vd6v/runs)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)

> Druxt = DRUpal + nUXT: fully decoupled Drupal, rendered by Nuxt.

Druxt connects a [Drupal](https://www.drupal.org) backend to a
[Nuxt](https://v2.nuxt.com) frontend. Drupal stays the editorial system your
authors know, Nuxt renders the site, and Druxt does the work between them: it
reads Drupal's JSON:API and turns routes, content entities, menus, blocks and
views into Vue components you can theme.

You choose how much of it to use. The `druxt-site` module gives you a complete
decoupled site out of the box, driven by your Drupal display configuration. Or
install individual modules and add decoupled routing, entity rendering or
menus to an existing Nuxt project.

## Try it

Create a working Drupal + Nuxt + Druxt project from the quickstart template:

```sh
npx giget@latest gh:druxt/quickstart#develop my-druxt-site
cd my-druxt-site
npm run setup
```

The [getting started tutorial](https://druxtjs.org/tutorials/getting-started)
walks through the same steps with explanations. Other starters cover
[Tome static content](https://github.com/druxt/quickstart-druxt-site-tome) and
[serverless](https://github.com/druxt/quickstart-druxt-serverless) setups.

Or add Druxt to an existing Nuxt 2 project against any Drupal site with
JSON:API enabled:

```sh
npm i druxt-site
```

```js
// nuxt.config.js
export default {
  modules: ['druxt-site'],
  druxt: {
    baseUrl: 'https://demo-api.druxtjs.org',
  },
};
```

## Features

- Fully decoupled Drupal, with [Nuxt](https://v2.nuxt.com) in the frontend.
- Drupal JSON:API client with Vuex caching, supporting
  [nuxt/axios](https://axios.nuxtjs.org/) and [nuxt/auth](https://auth.nuxtjs.org/).
- Modular Vue.js component library system.
- Slot and wrapper theming system, driven by Drupal display modes.
- Support for multilingual content.
- API and file proxy.

## Modules

| Module | Package | Purpose |
| ------ | ------- | ------- |
| [Druxt](https://druxtjs.org/modules/druxt) | `druxt` | The client, store and component foundation |
| [Blocks](https://druxtjs.org/modules/blocks) | `druxt-blocks` | Decoupled block and region rendering |
| [Breadcrumb](https://druxtjs.org/modules/breadcrumb) | `druxt-breadcrumb` | Router based breadcrumbs |
| [Entity](https://druxtjs.org/modules/entity) | `druxt-entity` | Content entities, forms and fields |
| [Menu](https://druxtjs.org/modules/menu) | `druxt-menu` | Decoupled Drupal menus |
| [Router](https://druxtjs.org/modules/router) | `druxt-router` | Drupal routes in Nuxt |
| [Schema](https://druxtjs.org/modules/schema) | `druxt-schema` | Display mode schemas |
| [Site](https://druxtjs.org/modules/site) | `druxt-site` | A decoupled Drupal site out of the box |
| [Views](https://druxtjs.org/modules/views) | `druxt-views` | Decoupled Drupal Views |

## Demo

The [Umami food magazine](https://umami.demo.druxtjs.org) demo renders
Drupal's Umami install profile through Druxt, with a
[Storybook](https://storybook.umami.demo.druxtjs.org) of its components.

## Documentation

Everything lives at [druxtjs.org](https://druxtjs.org): tutorials, how-to
guides, module documentation and the full API reference.

## Support

Find support or get involved in building Druxt via the community channels:

- [DruxtJS Discord server](https://discord.druxtjs.org)
- **#druxt** Slack channel on [Drupal.org slack](https://drupal.org/slack)

## Contributing

Druxt is an open-source project, built by the community for the community.
See the [Contributing guide](./CONTRIBUTING.md) for how to get involved.

This repository ships a dev container (`.devcontainer/devcontainer.json`) for
VS Code, GitHub Codespaces and [DevPod](https://devpod.sh), with Node, Yarn
and all dependencies installed on first open.

[![Open in DevPod!](https://devpod.sh/assets/open-in-devpod.svg)](https://devpod.sh/open#https://github.com/druxt/druxt.js)

## License

[MIT](https://github.com/druxt/druxt.js/blob/develop/LICENSE)
