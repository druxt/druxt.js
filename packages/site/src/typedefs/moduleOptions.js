 /**
  * DruxtSite Module options.
  *
  * @typedef {object} ModuleOptions
  *
  * @property {object} [axios] - [Axios instance settings](https://github.com/axios/axios#axioscreateconfig).
  * @property {string} baseUrl - The Drupal base URL.
  * @property {string} [endpoint=jsonapi] - The Drupal JSON:API endpoint.
  *
  * @example @lang js
  * {
  *   axios: {
  *     auth: { ... },
  *     headers: { ... },
  *   },
  *   baseUrl: 'https://demo-api.druxtjs.org',
  *   endpoint: 'jsonapi',
  * }
  */
