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
})
