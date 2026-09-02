# druxt-inspect (node-client)

A CLI for inspecting a Drupal JSON:API backend through Druxt's
framework-agnostic clients — no Vue, no Nuxt, no browser.

Built directly on `DruxtClient` and `DruxtSchema` (from `druxt` and
`druxt-schema`), the same classes every other example in this suite uses
under the hood — proof that they're plain Node-usable on their own. Useful
for exploring an unfamiliar backend's JSON:API shape, generating Vue
component stubs from a display mode's schema, or letting an AI coding agent
introspect a backend without spinning up a browser.

## What it demonstrates

- `DruxtClient`/`DruxtSchema` used entirely outside a Vue/Nuxt context.
- A real CLI built on the same framework-agnostic classes `node-client`'s
  sibling examples rely on internally.
- Jest tests running against **recorded JSON:API fixtures** (`test/record.js`
  captures them from a live backend) — no live backend needed to run the
  test suite, only for interactive/manual use.

## Commands

```text
Usage: druxt-inspect [options] <command> [args]

Commands:
  types                            List the JSON:API resource types
  schema <resourceType>            Print the view and form schemas
  stubs <resourceType>             Generate Druxt Entity wrapper stub(s)
  sample <resourceType>            Fetch a sample of entities
  views                            List the backend's Views

Options:
  -b, --baseUrl <url>              Drupal backend base URL
                                   (or set DRUXT_BASE_URL)
  -m, --mode <mode>                Display mode (schema, stubs)
  -o, --output <dir>               Write stub files to a directory (stubs)
  -l, --limit <n>                  Number of entities (sample)
      --json                       Output raw JSON instead of a table
  -V, --version                    Output the version number
  -h, --help                       Show this help
```

## Quick start

From this directory:

```bash
yarn install
node bin/druxt-inspect.js --help

# Against a running backend (docs/drupal/.devtools/start, or --baseUrl):
node bin/druxt-inspect.js types --baseUrl http://127.0.0.1:8888
node bin/druxt-inspect.js schema node--recipe --mode default --baseUrl http://127.0.0.1:8888
node bin/druxt-inspect.js stubs node--recipe --mode card --output components/ --baseUrl http://127.0.0.1:8888
```

`examples/node-client` isn't part of the root `yarn` workspace (only
`packages/*` is) — it needs its own `yarn install` here, same as every other
example directory in this suite.

## Testing

```bash
yarn test   # Jest, against recorded fixtures - no backend required
```

Or `yarn test:node-client` from the monorepo root.

To re-record fixtures against a live backend (e.g. after a schema change),
see `test/record.js`.
