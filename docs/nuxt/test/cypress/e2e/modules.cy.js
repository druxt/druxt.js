it('DruxtJS.org: Modules', () => {
  cy.visit('/')

  cy.contains('a', 'Browse modules').click()

  cy.url().should('include', '/modules')
  cy.get('h1').should('have.text', 'Druxt modules')

  // The index lists the runtime modules as cards, by display name.
  cy.get('a[href="/modules/entity"]').should('contain', 'Entity')

  // A module page carries the shared chrome: breadcrumb, source and
  // changelog.
  cy.visit('/modules/entity')
  cy.get('nav[aria-label="Breadcrumb"]').should('contain', 'Modules')
  cy.contains('a', 'Source').should('have.attr', 'href').and('include', 'github.com/druxt')
  cy.contains('a', 'Changelog').should('have.attr', 'href', '/api/packages/entity/CHANGELOG')

  // The module header is the page header on a package root, so the module
  // identity is named once, not once by the header and again by the page.
  cy.get('h1').should('have.length', 1).and('have.text', 'Entity')

  // Counting h1s cannot see one nested somewhere it may not be. The visible
  // title is a dropdown trigger, so a heading placed there ships inside a
  // <button>, which takes phrasing content only.
  cy.get('button h1').should('not.exist')

  // The same page at the URL its source filename spells out.
  cy.visit('/modules/entity/README')
  cy.get('h1').should('have.length', 1).and('have.text', 'Entity')

  cy.visit('/api/packages/entity')
  cy.get('h1').should('have.length', 1).and('have.text', 'Entity')

  // A page under a module keeps its own title, and only its own.
  cy.visit('/modules/entity/deprecations')
  cy.get('h1').should('have.length', 1).and('have.text', 'DruxtEntity deprecations')
})
