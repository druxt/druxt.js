it('Examples: Custom module (DruxtCardGrid)', () => {
  cy.visit('/examples/custom-module')

  cy.get('h1').should('have.text', 'Custom module: DruxtCardGrid')

  // Renders up to 6 recipe cards.
  cy.get('.druxt-card-grid').find('[data-fetch-key^="DruxtEntity:node--recipe"]')
    .its('length').should('be.gt', 0).and('be.lte', 6)
})
