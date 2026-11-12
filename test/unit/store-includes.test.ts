import { fieldsWithIncludes, includePaths, includesFor, subIncludes, topIncludes } from '../../src/utils/includes'

describe('include helpers', () => {
  test('includePaths reads a string or an array, and drops empty paths', () => {
    expect(includePaths('media, media.image,,uid')).toStrictEqual(['media', 'media.image', 'uid'])
    expect(includePaths(['media', ' uid ', ''])).toStrictEqual(['media', 'uid'])
    expect(includePaths(undefined)).toStrictEqual([])
    expect(includePaths('')).toStrictEqual([])
  })

  test('topIncludes gives the first relationship of each path, once each', () => {
    expect(topIncludes('media,media.image,uid')).toStrictEqual(['media', 'uid'])
    // A nested path includes the relationships along it.
    expect(topIncludes('media.image')).toStrictEqual(['media'])
  })

  test('subIncludes gives the paths below a relationship, relative to it', () => {
    expect(subIncludes('media,media.image,media.image.file,uid', 'media')).toStrictEqual('image,image.file')
    expect(subIncludes('media,uid', 'media')).toStrictEqual('')
    // A relationship whose name starts the same is not below it.
    expect(subIncludes('media_extra.image', 'media')).toStrictEqual('')
  })

  test('fieldsWithIncludes adds the included relationships to a fieldset, once each', () => {
    expect(fieldsWithIncludes('title,uid', 'uid,field_media,field_media.image')).toStrictEqual('title,uid,field_media')
    expect(fieldsWithIncludes('title', 'field_content.field_media')).toStrictEqual('title,field_content')
    expect(fieldsWithIncludes('title,', '')).toStrictEqual('title')
  })

  test('includesFor keeps the paths whose relationship the fields or the resource name', () => {
    const include = 'field_media,field_media.field_media_image'
    // A text paragraph lists its fields without field_media and is not known to have it.
    expect(includesFor(include, 'behavior_settings,field_text')).toStrictEqual('')
    // An image paragraph lists field_media.
    expect(includesFor(include, 'behavior_settings,field_media')).toStrictEqual(include)
    // A stored copy shows the relationship even when the fields don't list it.
    expect(includesFor(include, 'title', ['field_media'])).toStrictEqual(include)
    // Without a fieldset for the type, nothing decides, so the include stays as given.
    expect(includesFor(include, undefined)).toStrictEqual(include)
    expect(includesFor(['a', 'b'], undefined)).toStrictEqual(['a', 'b'])
    expect(includesFor('', 'title')).toStrictEqual('')
  })
})
