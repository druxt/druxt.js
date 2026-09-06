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

  // The same page, reached by the URL its source filename spells out. The
  // sitemap lists the collapsed path, but both resolve, and both used to
  // print the module identity twice. Found by drx://docs.
  test('index routes for a package root', () => {
    expect(isPackageRoot('/modules/entity/README')).toBe(true)
    expect(isPackageRoot('/modules/entity/README/')).toBe(true)
    expect(isPackageRoot('/api/packages/entity/index')).toBe(true)
    expect(isPackageRoot('/api/packages/entity/index/')).toBe(true)
  })

  // '' is falsy, so an empty segment slips past a truthiness guard on the
  // segment after the package name.
  test('doubled slashes do not read as a package root', () => {
    expect(isPackageRoot('/api/packages/entity//CHANGELOG')).toBe(false)
    expect(isPackageRoot('/modules/entity//deprecations')).toBe(false)
    // Pinning that normalising the separators does not break the ordinary case.
    expect(isPackageRoot('//modules//entity')).toBe(true)
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
    // An index segment collapses to the section, not to a package.
    expect(isPackageRoot('/modules/README')).toBe(false)
    expect(isPackageRoot('/api/packages/index')).toBe(false)
    // A private package keeps its own header at either URL.
    expect(isPackageRoot('/api/packages/docgen/index')).toBe(false)
  })
})

describe('moduleName', () => {
  test('the core package keeps its bare name', () => {
    expect(moduleName('druxt')).toBe('druxt')
    expect(moduleName('entity')).toBe('druxt-entity')
  })
})
