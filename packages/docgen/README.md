# druxt-docgen

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

API doc generation tool for Druxt modules.

`druxt-docgen` scrapes the JSDoc from `packages/*/src` (via
jsdoc-to-markdown) and the props/computed of Vue components (via
vue-docgen-api), and renders them as the Markdown pages that power the
[druxtjs.org](https://druxtjs.org) API reference.

## Installation

Private CLI inside the druxt.js monorepo — no npm install. From the monorepo
root, dependencies come with `yarn install`; the binary is built by
`yarn build` (siroc) as `packages/docgen/bin/druxt-docgen.js`.

## Usage

From the druxt.js monorepo root (Node 16 via mise):

```sh
yarn build        # builds bin/druxt-docgen.js (required first)
yarn build:docs   # runs docgen against packages/*/src
```

Output lands under `docs/nuxt/content/api/` (gitignored — always
generated, never committed), plus per-package CHANGELOG copies and the
root CONTRIBUTING guide.

What it generates:

| Output                               | Source                                                                |
| ------------------------------------ | --------------------------------------------------------------------- |
| `content/api/**`                     | JSDoc from `packages/*/src/**/*.js`, component docs from `.vue` files |
| `content/api/README.md`              | Package list with versions from `package.json`                        |
| `content/api/components.md`          | Components index                                                      |
| `content/modules/<pkg>/CHANGELOG.md` | `packages/<pkg>/CHANGELOG.md`                                         |
| `content/how-to/contributing.md`     | root `CONTRIBUTING.md`                                                |

Because the JSDoc **is** the public API reference, the monorepo's ESLint
config enforces complete `@param` typing and descriptions — see the
monorepo AGENTS.md for the rules and their rationale.

## License

[MIT](https://github.com/druxt/druxt.js/blob/develop/LICENSE)
