it('Examples: Index links every demo page', () => {
  cy.visit('/examples')

  cy.get('h1').should('have.text', 'DruxtJS Examples')

  const pages = [
    '/examples/debug',
    '/examples/entity-queries',
    '/examples/entity-explorer',
    '/examples/entity-form',
    '/examples/menu-edit',
    '/examples/router-modes',
    '/examples/schema',
    '/examples/wrappers',
    '/examples/custom-module',
  ]

  for (const path of pages) {
    cy.get(`a[href="${path}"]`).should('exist')
  }
})
