 /**
  * Druxt Schema configuration object.
  *
  * @typedef {object} SchemaConfiguration
  *
  * @property {string} bundle - The Drupal Entity bundle.
  * @property {string} entityType - The Drupal Entity type.
  * @property {string[]} filter - Array of regex strings used to filter the generated schema files.
  * @property {string} mode - The Drupal Display mode.
  * @property {('view'|'form')} schemaType - The Schema type.
  *
  * @example @lang js
  * {
  *   bundle: 'page',
  *   entityType: 'node',
  *   filters: [],
  *   mode: 'default',
  *   schemaType: 'view'
  * }
  */
