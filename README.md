# \<druxt-entity />

[![CircleCI](https://circleci.com/gh/druxt/druxt-entity.svg?style=svg)](https://circleci.com/gh/druxt/druxt-entity)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt-entity/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt-entity?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt-entity/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt-entity)

Provides an Entity render Vue component to be used within a Druxt (DRUpal nuXT) project.

## Links

- Druxt.js: https://druxtjs.org
- Documentation: https://entity.druxtjs.org

## Install

`$ npm install druxt-entity`

## Usage

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: [
    ...
    'druxt-entity',
    'druxt-router'
  ],

  druxt: {
    baseUrl: 'https://example.com',
    entity: {
      suggestions: []
    }
  }
}
```

## Options

### Base Druxt options

These options are available to all Druxt modules.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `axios` | `object` | No | `{}` | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl` | `string` | Yes | `null` | Base URL for the Drupal installation. |

### Druxt Entity options

These options are specific to this module.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `entity.suggestions` | `array` | No | `[]` | Array of component suggestions. |

### Component suggestions.

Both the `<druxt-entity />` and `<druxt-field />` components utilize a component suggestion system.

The first suggestion to match a registered Vue component will be used to render the relevant component.

You can provide additional suggestions via the below configuration options.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `entity.suggestions[n].type` | `string` | No | `null` | Component type. E.g., `entity`, `field` |
| `entity.suggestions[n].value` | `function`,  `string` | No | `null` | A String or Function that returns a String containing a suggested Component to render. |

**Example:**

```js
  druxt: {
    entity: {
      suggestions: [
        {
          type: 'entity',
          value: ctx => {
            // If Homepage route and entity...
            if (ctx.route.isHomePath && ctx.route.props.uuid === ctx.entity.id) {
              // DruxtEntityHome
              return ctx.tokens.prefix + 'Home'
            }
          }
        }
      ]
    }
  }
```
