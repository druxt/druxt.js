// Helpers for JSON:API include paths, such as `field_media,field_media.field_media_image`.

/**
 * The paths an include names.
 *
 * @param {string|string[]} [include] - A comma-separated include, or an array of paths.
 *
 * @returns {string[]} Each path, trimmed, with empty ones left out.
 */
export const includePaths = (include) =>
  (Array.isArray(include) ? include : String(include || '').split(','))
    .map((path) => String(path).trim())
    .filter((path) => path)

/**
 * The relationships an include names directly, leaving out nested paths.
 *
 * @example @lang js
 * topIncludes('media,media.image,uid') // ['media', 'uid']
 *
 * @param {string|string[]} [include] - The include.
 *
 * @returns {string[]} The top-level relationship names.
 */
export const topIncludes = (include) => includePaths(include).filter((path) => !path.includes('.'))

/**
 * The paths below one relationship, relative to it.
 *
 * @example @lang js
 * subIncludes('media,media.image,media.image.file', 'media') // 'image,image.file'
 *
 * @param {string|string[]} [include] - The include.
 * @param {string} key - The relationship.
 *
 * @returns {string} The paths below it, comma-separated.
 */
export const subIncludes = (include, key) =>
  includePaths(include)
    .filter((path) => path.startsWith(`${key}.`))
    .map((path) => path.slice(key.length + 1))
    .join(',')

/**
 * A type's sparse fieldset with the relationships an include names added.
 *
 * Drupal leaves a relationship out of the document when the fieldset doesn't
 * name it, so the store could not find what it included.
 *
 * @param {string} fields - The type's comma-separated fieldset.
 * @param {string|string[]} [include] - The include.
 *
 * @returns {string} The fieldset, comma-separated, each field once.
 */
export const fieldsWithIncludes = (fields, include) =>
  Array.from(new Set([...String(fields).split(','), ...topIncludes(include)]))
    .filter((field) => field)
    .join(',')

/**
 * The include paths a resource's type can take.
 *
 * Drupal answers 400 to an include a type lacks. When a query lists a type's
 * fields, as schema mode lists the fields its display renders, a path whose
 * relationship those fields don't name is left out, unless the resource is
 * known to have that relationship.
 *
 * @param {string|string[]} [include] - The include.
 * @param {string} [fields] - The type's comma-separated fieldset. Without one, the include is kept whole.
 * @param {string[]} [relationships] - Relationships the resource is known to have.
 *
 * @returns {string|string[]|undefined} The paths it can take, comma-separated, or the include as given when nothing decides.
 */
export const includesFor = (include, fields, relationships = []) => {
  if (!include || typeof fields !== 'string') return include
  const listed = fields.split(',')
  return includePaths(include)
    .filter((path) => {
      const key = path.split('.')[0]
      return listed.includes(key) || relationships.includes(key)
    })
    .join(',')
}
