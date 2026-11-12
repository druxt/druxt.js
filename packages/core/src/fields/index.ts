// @druxt/core/fields: which fields an entity request asks for.
//
// It is framework free. Nothing here imports Vue, Nuxt or h3, so a React adapter resolves fields as the Vue one does.

/**
 * The `query.schema` setting.
 *
 * - `auto` asks for the display's fields, and every field a wrapper reads.
 * - `true` asks for the display's fields alone.
 * - `false` asks for every field.
 */
export type DruxtEntityFieldsMode = 'auto' | boolean

/**
 * The fields a wrapper reads.
 *
 * It is their names, or `*` when the wrapper reads fields its source does not name, such as `attributes[key]`.
 */
export type DruxtWrapperFields = string[] | '*'

/**
 * Gets the fields an entity request asks for, or undefined for every field.
 *
 * - `false`: every field.
 * - `true`: the display's fields.
 * - `auto`: the display's fields, and every field a wrapper candidate reads. A wrapper that reads fields its source
 *   does not name asks for every field, because an unknown read is never answered with less.
 *
 * @param displayFields - The fields the display shows.
 * @param wrapperFields - What each wrapper candidate present in the build reads.
 * @param mode - `query.schema`.
 * @returns The field names, or undefined for every field.
 *
 * @example @lang js
 * resolveEntityFields(['body', 'field_tags'], [['field_subtitle']], 'auto') // ['body', 'field_tags', 'field_subtitle']
 * resolveEntityFields(['body'], ['*'], 'auto') // undefined
 */
export function resolveEntityFields(displayFields: string[], wrapperFields: DruxtWrapperFields[], mode: DruxtEntityFieldsMode): string[] | undefined {
  if (mode === false) return undefined
  if (mode === true) return [...new Set(displayFields)]
  if (wrapperFields.includes('*')) return undefined
  return [...new Set([...displayFields, ...(wrapperFields as string[][]).flat()])]
}
