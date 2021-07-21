/**
 * The Druxt Schema object.
 *
 * @typedef {object} Schema
 *
 * @property {SchemaConfiguration} config - The schema configuration object.
 * @property {object} data - The raw JSON:API resources data.
 * @property {string} displayId - The Drupal Display ID.
 * @property {DruxtSchema} druxtSchema - Instance of the Druxt Schema.
 * @property {object} fields - The processed Field schema data.
 * @property {string} id - The schema ID.
 * @property {boolean} isValid - Valid if the Schema is a match for the configuration filters.
 * @property {string} resourceType - The JSON:API resource type.
 *
 * @example @lang js
 * {
 *   config: {
 *     bundle: 'page',
 *     entityType: 'node',
 *     filter: [],
 *     mode: 'default',
 *     schemaType: 'view',
 *   },
 *   data: {
 *     'entity_view_display--entity_view_display': [
 *       // Entity View Display JSON:API Resource data.
 *     ],
 *     'field_config--field_config': [
 *       // Field Config JSON:API Resource data.
 *     ],
 *   },
 *   displayId: 'node.page.default',
 *   druxtSchema: DruxtSchema {},
 *   fields: {
 *     body: {
 *       description: '',
 *       id: 'body',
 *       label: {
 *         position: 'hidden',
 *         text: 'Body',
 *       },
 *       required: false,
 *       settings: {
 *         config: {
 *           display_summary: true,
 *         },
 *         display: [],
 *       },
 *       thirdPartySettings: [],
 *       type: 'text_default',
 *       weight: 100,
 *     },
 *     ...
 *   },
 *   id: 'node--page--default--view',
 *   isValud: true,
 *   resourceType: 'node--page',
 *   schema: Schema { }
 * }
 */

 /**
 * @typedef {object} SchemaConfiguration
 * @see {@link ./schemaConfiguration|SchemaConfiguration}
 */
