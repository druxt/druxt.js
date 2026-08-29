import fs from 'fs'
import globby from 'globby'
import jsdoc2md from 'jsdoc-to-markdown'
import mkdirp from 'mkdirp'
import ncp from 'ncp'
import vueDocs from 'vue-docgen-api'
import dmd from 'dmd'

import { DruxtDocgen } from '../src'

jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  existsSync: jest.fn(() => false),
  readFileSync: jest.fn()
}))
jest.mock('globby', () => jest.fn())
jest.mock('jsdoc-to-markdown', () => ({ getTemplateDataSync: jest.fn() }))
jest.mock('mkdirp', () => ({ sync: jest.fn() }))
jest.mock('ncp', () => jest.fn())
jest.mock('vue-docgen-api', () => ({ parse: jest.fn() }))
jest.mock('dmd', () => jest.fn())
jest.mock('consola', () => ({ info: jest.fn() }))

let docgen

describe('DruxtDocgen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    docgen = new DruxtDocgen()
  })

  test('constructor', () => {
    expect(docgen.components).toStrictEqual([])
    expect(docgen.destination).toBe('docs/nuxt/content')
  })

  test('generateDocs calls each generator in order', async () => {
    docgen.generateApiDocs = jest.fn()
    docgen.generatePackageList = jest.fn()
    docgen.generateComponentsList = jest.fn()
    docgen.generateModuleReadmes = jest.fn()
    docgen.copyFiles = jest.fn()

    await docgen.generateDocs()

    expect(docgen.generateApiDocs).toHaveBeenCalledTimes(1)
    expect(docgen.generatePackageList).toHaveBeenCalledTimes(1)
    expect(docgen.generateComponentsList).toHaveBeenCalledTimes(1)
    expect(docgen.generateModuleReadmes).toHaveBeenCalledTimes(1)
    expect(docgen.copyFiles).toHaveBeenCalledTimes(1)
    expect(docgen.generateApiDocs.mock.invocationCallOrder[0])
      .toBeLessThan(docgen.generatePackageList.mock.invocationCallOrder[0])
    expect(docgen.generatePackageList.mock.invocationCallOrder[0])
      .toBeLessThan(docgen.generateComponentsList.mock.invocationCallOrder[0])
    expect(docgen.generateComponentsList.mock.invocationCallOrder[0])
      .toBeLessThan(docgen.generateModuleReadmes.mock.invocationCallOrder[0])
    expect(docgen.generateModuleReadmes.mock.invocationCallOrder[0])
      .toBeLessThan(docgen.copyFiles.mock.invocationCallOrder[0])
  })

  describe('copyFiles', () => {
    test('copies changelogs and the contributing guide', async () => {
      globby.mockResolvedValueOnce(['packages/druxt/CHANGELOG.md'])
      ncp.mockImplementation((from, to, optionsOrCb, maybeCb) => {
        const cb = typeof optionsOrCb === 'function' ? optionsOrCb : maybeCb
        if (cb) cb()
      })

      await docgen.copyFiles()

      expect(globby).toHaveBeenCalledWith('packages/*/CHANGELOG.md')
      expect(ncp).toHaveBeenCalledWith(
        'packages/druxt/CHANGELOG.md',
        'docs/nuxt/content/api/packages/druxt/CHANGELOG.md',
        expect.any(Object),
        expect.any(Function)
      )
      expect(ncp).toHaveBeenCalledWith(
        'CONTRIBUTING.md',
        'docs/nuxt/content/how-to/contributing.md'
      )
    })
  })

  describe('processJs', () => {
    test('fixes Vuex inner-scoped state', async () => {
      const templateData = [{ name: 'state', scope: 'inner' }]

      await docgen.processJs('file.js', templateData)

      expect(templateData[0].scope).toBeUndefined()
    })

    test('promotes @mutator-tagged items to mutation methods', async () => {
      const templateData = [{
        mutators: [{ description: 'Sets the value.' }]
      }]

      await docgen.processJs('file.js', templateData)

      expect(templateData[0]).toMatchObject({
        description: 'Sets the value.',
        kind: 'method',
        scope: 'mutation'
      })
    })

    test('leaves unrelated items untouched', async () => {
      const templateData = [{ name: 'foo', scope: 'static' }]

      await docgen.processJs('file.js', templateData)

      expect(templateData[0]).toStrictEqual({ name: 'foo', scope: 'static' })
    })
  })

  describe('processVue', () => {
    test('injects undocumented props from vue-docgen-api', async () => {
      vueDocs.parse.mockResolvedValueOnce({
        displayName: 'DruxtTest',
        props: [{ name: 'foo', description: 'A prop.', tags: {} }]
      })

      const templateData = [{ id: 'module:DruxtTest', memberof: null }]

      await docgen.processVue('src/components/DruxtTest.vue', templateData)

      const injected = templateData.find((item) => item.name === 'foo')
      expect(injected).toMatchObject({
        id: 'module:DruxtTest.props.foo',
        kind: 'member',
        scope: 'static',
        memberof: 'module:DruxtTest.props'
      })
    })

    test('does not duplicate props already present in templateData', async () => {
      vueDocs.parse.mockResolvedValueOnce({
        displayName: 'DruxtTest',
        props: [{ name: 'foo', description: 'A prop.', tags: {} }]
      })

      const templateData = [
        { id: 'module:DruxtTest', memberof: null },
        { id: 'module:DruxtTest.props.foo', name: 'foo' }
      ]

      await docgen.processVue('src/components/DruxtTest.vue', templateData)

      expect(templateData.filter((item) => item.name === 'foo')).toHaveLength(1)
    })

    test('expands @vue-computed tagged items into computed properties', async () => {
      vueDocs.mockResolvedValueOnce
      vueDocs.parse.mockResolvedValueOnce({ displayName: 'DruxtTest', props: [] })

      const templateData = [{
        id: 'module:DruxtTest.computed.foo',
        memberof: 'module:DruxtTest.computed',
        description: '<p>Text</p><table>junk</table>',
        _vueComputed: [{ name: 'bar' }]
      }]

      await docgen.processVue('src/components/DruxtTest.vue', templateData)

      // The source strips from `</p` onward (note: no closing `>`), so the
      // trailing `>` of `</p>` is stripped along with the rest.
      expect(templateData[0].description).toBe('<p>Text')
      const expanded = templateData.find((item) => item.id.endsWith('.computed.bar'))
      expect(expanded).toMatchObject({
        kind: 'property',
        scope: 'static',
        memberof: 'module:DruxtTest.computed'
      })
    })

    test('derives memberof from id when missing', async () => {
      vueDocs.parse.mockResolvedValueOnce({ displayName: 'DruxtTest', props: [] })

      const templateData = [{ id: 'module:DruxtTest.methods.foo', memberof: null }]

      await docgen.processVue('src/components/DruxtTest.vue', templateData)

      expect(templateData[0].memberof).toBe('module:DruxtTest.methods')
    })

    test('injects type and default value from vue-docgen-api', async () => {
      vueDocs.parse.mockResolvedValueOnce({
        displayName: 'DruxtTest',
        props: [{
          name: 'foo',
          description: 'A prop.',
          type: { name: 'union', elements: [{ name: 'boolean' }, { name: 'object' }] },
          defaultValue: { value: 'false' },
          tags: {}
        }]
      })

      const templateData = [{ id: 'module:DruxtTest', memberof: null }]

      await docgen.processVue('src/components/DruxtTest.vue', templateData)

      const injected = templateData.find((item) => item.name === 'foo')
      expect(injected.type).toStrictEqual({ names: ['boolean', 'object'] })
      expect(injected.defaultvalue).toBe('false')
    })

    test('injects a props container when the file documents no props inline', async () => {
      vueDocs.parse.mockResolvedValueOnce({
        displayName: 'DruxtTest',
        props: [{ name: 'foo', description: 'A prop.', tags: {} }]
      })

      const templateData = [{ id: 'module:DruxtTest', memberof: null }]

      await docgen.processVue('src/components/DruxtTest.vue', templateData)

      expect(templateData.map((o) => o.id)).toContain('module:DruxtTest.props')
    })

    test('injects inherited members from resolved extends/mixins sources', async () => {
      vueDocs.parse.mockResolvedValueOnce({ displayName: 'DruxtTest', props: [] })
      fs.existsSync.mockReturnValueOnce(true)
      fs.readFileSync.mockReturnValueOnce(`
<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'

export default {
  name: 'DruxtTest',
  extends: DruxtModule
}
</script>
`)
      jsdoc2md.getTemplateDataSync.mockReturnValueOnce([
        { id: 'module:DruxtModule', kind: 'module' },
        { id: 'module:DruxtModule.methods.getScopedSlots', kind: 'function', memberof: 'module:DruxtModule.methods' },
        { id: 'module:DruxtModule.props.value', kind: 'member', memberof: 'module:DruxtModule.props' },
        { id: 'Unused', kind: 'member' }
      ])

      const templateData = [{ id: 'module:DruxtTest', memberof: null }]

      await docgen.processVue('src/components/DruxtTest.vue', templateData)

      const method = templateData.find((item) => item.id === 'module:DruxtTest.methods.getScopedSlots')
      expect(method).toMatchObject({ kind: 'function', memberof: 'module:DruxtTest.methods' })

      // Items not belonging to the referenced mixin are not injected.
      expect(templateData.find((item) => item.id === 'Unused')).toBeUndefined()
    })
  })

  describe('writeTemplateData', () => {
    test('does nothing when templateData is falsy', () => {
      docgen.writeTemplateData('src/foo.js', null)

      expect(dmd).not.toHaveBeenCalled()
      expect(fs.writeFileSync).not.toHaveBeenCalled()
    })

    test('does nothing when dmd produces no content', () => {
      dmd.mockReturnValueOnce('')

      docgen.writeTemplateData('src/foo.js', [{ id: 'module:foo' }])

      expect(fs.writeFileSync).not.toHaveBeenCalled()
    })

    test('writes generated markdown with frontmatter', () => {
      dmd.mockReturnValueOnce('# Foo\n\nDocs.')

      docgen.writeTemplateData('src/components/DruxtFoo.vue', [{ id: 'module:DruxtFoo' }])

      expect(mkdirp.sync).toHaveBeenCalledWith('docs/nuxt/content/api/components')
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'docs/nuxt/content/api/components/DruxtFoo.md',
        expect.stringContaining('title: DruxtFoo')
      )
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('# Foo\n\nDocs.')
      )
    })

    test('titles a package index after the package, not the first symbol', () => {
      dmd.mockReturnValueOnce('# DruxtSiteMixin')

      docgen.writeTemplateData('packages/site/src/index.js', [{ id: 'module:DruxtSiteMixin' }])

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('title: Site')
      )
    })

    test('leaves per-symbol page titles alone', () => {
      dmd.mockReturnValueOnce('# DruxtClient')

      docgen.writeTemplateData('packages/druxt/src/client.js', [{ id: 'DruxtClient' }])

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('title: DruxtClient')
      )
    })

    test('flags the page when the documented symbol is deprecated', () => {
      dmd.mockReturnValueOnce('# ~~DruxtFoo~~')

      docgen.writeTemplateData('src/components/DruxtFoo.vue', [
        { id: 'module:DruxtFoo', deprecated: true },
      ])

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('deprecated: true')
      )
    })

    test('flags a class whose root is the constructor signature', () => {
      dmd.mockReturnValueOnce('# ~~DruxtClass~~')

      docgen.writeTemplateData('src/class.js', [
        { id: 'DruxtClass()' },
        { id: 'DruxtClass', deprecated: true },
      ])

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('deprecated: true')
      )
    })

    test('does not flag the page when only a member is deprecated', () => {
      dmd.mockReturnValueOnce('# DruxtMenu')

      docgen.writeTemplateData('src/components/DruxtMenu.vue', [
        { id: 'module:DruxtMenu' },
        { id: 'module:DruxtMenu.computed.items', deprecated: true },
      ])

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.stringContaining('deprecated:')
      )
    })
  })

  describe('generateApiDocs', () => {
    test('dispatches .js files to processJs and .vue files to processVue', async () => {
      globby.mockResolvedValueOnce(['packages/druxt/src/index.js', 'packages/druxt/src/components/Druxt.vue'])
      jsdoc2md.getTemplateDataSync.mockReturnValue([{ id: 'module:test' }])
      vueDocs.parse.mockResolvedValue({ displayName: 'Druxt', props: [] })

      docgen.processJs = jest.fn()
      docgen.processVue = jest.fn()
      docgen.writeTemplateData = jest.fn()

      await docgen.generateApiDocs()

      expect(docgen.processJs).toHaveBeenCalledWith('packages/druxt/src/index.js', expect.any(Array))
      expect(docgen.processVue).toHaveBeenCalledWith('packages/druxt/src/components/Druxt.vue', expect.any(Array))
      expect(docgen.writeTemplateData).toHaveBeenCalledTimes(2)
    })

    test('tracks Vue components for the components list', async () => {
      globby.mockResolvedValueOnce(['packages/druxt/src/components/Druxt.vue'])
      jsdoc2md.getTemplateDataSync.mockReturnValue([{ id: 'module:test' }])

      docgen.processVue = jest.fn()
      docgen.writeTemplateData = jest.fn()

      await docgen.generateApiDocs()

      expect(docgen.components).toHaveLength(1)
      expect(docgen.components[0]).toMatchObject({ file: 'packages/druxt/src/components/Druxt.vue' })
    })
  })

  describe('generateComponentsList', () => {
    test('writes an index of top-level components only', () => {
      docgen.components = [
        { file: 'packages/druxt/src/components/Druxt.vue', templateData: [{ name: 'Druxt', description: 'The Druxt component.' }] },
        // Nested component (path has more than 5 segments) should be excluded.
        { file: 'packages/druxt/src/components/nested/Deep.vue', templateData: [{ name: 'Deep', description: '...' }] }
      ]

      docgen.generateComponentsList()

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'docs/nuxt/content/components/README.md',
        expect.stringContaining('## Druxt')
      )
      const [, content] = fs.writeFileSync.mock.calls[0]
      expect(content).not.toContain('## Deep')
    })
  })

  describe('generatePackageList', () => {
    test('writes an index of public packages, sorted and filtered', async () => {
      globby.mockResolvedValueOnce([
        'packages/druxt/package.json',
        'packages/test-utils/package.json'
      ])

      jest.doMock(
        '../../../packages/druxt/package.json',
        () => ({ name: 'druxt', version: '1.0.0', description: 'Core.', private: false }),
        { virtual: true }
      )
      jest.doMock(
        '../../../packages/test-utils/package.json',
        () => ({ name: 'druxt-test-utils', version: '0.1.0', private: true }),
        { virtual: true }
      )

      await docgen.generatePackageList()

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'docs/nuxt/content/api/README.md',
        expect.stringContaining('## druxt')
      )
      const [, content] = fs.writeFileSync.mock.calls[0]
      expect(content).not.toContain('druxt-test-utils')
    })
  })

  describe('generateModuleReadmes', () => {
    test('writes a labeled page per public package with a README', async () => {
      globby.mockResolvedValueOnce([
        'packages/druxt/package.json',
        'packages/test-utils/package.json'
      ])

      jest.doMock(
        '../../../packages/druxt/package.json',
        () => ({ name: 'druxt', version: '1.0.0', private: false }),
        { virtual: true }
      )
      jest.doMock(
        '../../../packages/test-utils/package.json',
        () => ({ name: 'druxt-test-utils', version: '0.1.0', private: true }),
        { virtual: true }
      )
      fs.existsSync.mockReturnValueOnce(true)
      fs.readFileSync.mockReturnValueOnce('# druxt\n\nCore package.\n')

      await docgen.generateModuleReadmes()

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1)
      const [destination, content] = fs.writeFileSync.mock.calls[0]
      expect(destination).toBe('docs/nuxt/content/modules/druxt/readme/index.md')
      expect(content).toContain('title: druxt README')
      expect(content).toContain('# druxt')
      expect(content).toContain('automatically generated')
    })
  })
})
