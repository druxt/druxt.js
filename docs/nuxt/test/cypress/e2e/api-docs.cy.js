// Requires the generated API content (`yarn build:docs`), which CI runs
// before this suite.
it('DruxtJS.org: API documentation', () => {
  cy.visit('/api')

  cy.get('h1').should('have.text', 'Packages')

  // The index links each package's generated reference.
  cy.contains('a', 'Read the docs').should('exist')

  // A generated API document renders with its source link.
  cy.visit('/api/packages/druxt/client')
  cy.get('h1').should('contain', 'DruxtClient')
  cy.contains('a', 'View source on GitHub').should('exist')
})
