# druxt-docgen

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

API doc generation tool for Druxt modules.

`druxt-docgen` scrapes the JSDoc from `packages/*/src` (via
jsdoc-to-markdown) and the props/computed of Vue components (via
vue-docgen-api), and renders them as the Markdown pages that power the
[druxtjs.org](https://druxtjs.org) API reference.

## Installation

Private CLI inside the druxt.js monorepo - no npm install. From the monorepo
root, dependencies come with `yarn install`; the binary is built by
`yarn build` (siroc) as `packages/docgen/bin/druxt-docgen.js`.

## Usage

From the druxt.js monorepo root (Node 16 via mise):

```bash
yarn build                                              # builds the CLI
node packages/docgen/bin/druxt-docgen.js                # writes ./content
node packages/docgen/bin/druxt-docgen.js -d site/content   # or elsewhere
```

The output target is the caller's concern: the druxtjs.org site repo
(druxt/druxtjs.org) instantiates `DruxtDocgen` with its own destination.
The default destination is a bare `content/` relative to the working
directory, plus per-package CHANGELOG copies and the root CONTRIBUTING
guide.

What it generates:

| Output                               | Source                                                                |
| ------------------------------------ | --------------------------------------------------------------------- |
| `content/api/**`                     | JSDoc from `packages/*/src/**/*.js`, component docs from `.vue` files |
| `content/api/README.md`              | Package list with versions from `package.json`                        |
| `content/api/components.md`          | Components index                                                      |
| `content/modules/<pkg>/CHANGELOG.md` | `packages/<pkg>/CHANGELOG.md`                                         |
| `content/how-to/contributing.md`     | root `CONTRIBUTING.md`                                                |

Because the JSDoc is the public API reference, the monorepo's ESLint
config enforces complete `@param` typing and descriptions - see the
monorepo AGENTS.md for the rules and their rationale.

## License

[MIT](https://github.com/druxt/druxt.js/blob/develop/LICENSE)
