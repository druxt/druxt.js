 /**
  * DruxtMenu Module options.
  *
  * @typedef {object} ModuleOptions
  *
  * @property {string} [endpoint=jsonapi] - The Drupal JSON:API endpoint.
  * @property {MenuOptions} [menu] - The DruxtMenu options.
  * @property {DruxtClient} [druxtClient] - An existing DruxtClient instance to reuse, else a new one is created.
  *
  * @see {@link ./menuOptions|MenuOptions}
  *
  * @example @lang js
  * {
  *   endpoint: 'jsonapi',
  *   menu: {}
  * }
  */
