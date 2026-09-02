# druxt-test-utils

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Shared test utilities for Druxt module development — Jest helpers that mock
the Drupal JSON:API layer so unit tests run without a live backend.

## Installation

`druxt-test-utils` is a private workspace package used by the druxt.js
monorepo's own test suites. To use it in a Druxt package inside the
monorepo:

```sh
yarn workspace <package> add -D "druxt-test-utils@workspace:^"
```

## Usage

The helpers run a real `DruxtClient` against a Jest-mocked axios, so tests
need the module mock in place — as used throughout the monorepo's own
suites (see `packages/druxt/test/client.test.js`):

```js
import mockAxios from 'jest-mock-axios';
import { getMockResource } from 'druxt-test-utils';

jest.mock('axios');

test('getResource', async () => {
  const mockArticle = await getMockResource('node--article');

  const resource = await druxt.getResource(mockArticle.data.type, mockArticle.data.id);
  expect(resource.data).toHaveProperty('type', mockArticle.data.type);
});
```

Available helpers:

| Export                                   | Purpose                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `getMockResource(resourceType, query)`   | A mocked JSON:API resource (fetches a real one's shape from the demo backend structure). |
| `getMockCollection(resourceType, query)` | A mocked JSON:API collection.                                                            |
| `getMockRoute(path)`                     | A mocked decoupled router `translate-path` response.                                     |
| `baseUrl`                                | The mock backend base URL (`https://demo-api.druxtjs.org`).                              |

See the packages' `test/` directories (`packages/druxt`,
`packages/entity`, …) for real-world usage, and the druxt.js monorepo
CONTRIBUTING guide for the wider test setup.
