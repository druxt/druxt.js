import { isPackageRoot, moduleName, modulePkgs } from '~/components/app/icon/module'

describe('isPackageRoot', () => {
  test('module and API roots of a known package', () => {
    expect(isPackageRoot('/modules/entity')).toBe(true)
    expect(isPackageRoot('/modules/entity/')).toBe(true)
    expect(isPackageRoot('/api/packages/entity')).toBe(true)
    expect(isPackageRoot('/api/packages/entity/')).toBe(true)
  })

  test('every module package is covered', () => {
    for (const pkg of modulePkgs) {
      expect(isPackageRoot('/modules/' + pkg)).toBe(true)
      expect(isPackageRoot('/api/packages/' + pkg)).toBe(true)
    }
  })

  // These are the pages that keep their own header: the module header above
  // them names the module, not the page.
  test('pages beneath a package root', () => {
    expect(isPackageRoot('/modules/entity/deprecations')).toBe(false)
    expect(isPackageRoot('/api/packages/entity/CHANGELOG')).toBe(false)
    expect(isPackageRoot('/api/packages/entity/components/DruxtEntity')).toBe(false)
  })

  test('section indexes and unknown packages', () => {
    expect(isPackageRoot('/modules')).toBe(false)
    expect(isPackageRoot('/api')).toBe(false)
    expect(isPackageRoot('/api/packages')).toBe(false)
    // Private packages have no module header, so their pages need their own.
    expect(isPackageRoot('/modules/docgen')).toBe(false)
    expect(isPackageRoot('/api/packages/docgen')).toBe(false)
    expect(isPackageRoot('/how-to/proxy')).toBe(false)
  })
})

describe('moduleName', () => {
  test('the core package keeps its bare name', () => {
    expect(moduleName('druxt')).toBe('druxt')
    expect(moduleName('entity')).toBe('druxt-entity')
  })
})
