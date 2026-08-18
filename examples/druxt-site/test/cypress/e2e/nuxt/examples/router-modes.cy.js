it('Examples: DruxtRouter modes', () => {
  cy.visit('/examples/router-modes')

  cy.get('h1').first().should('have.text', 'DruxtRouter - Router modes')

  // Four documented modes, each its own section.
  cy.contains('h2', 'Component - Default').should('exist')
  cy.contains('h2', 'Component - Path prop').should('exist')
  cy.contains('h2', 'Page: Wildcard').should('exist')
  cy.contains('h2', 'Page: Extend').should('exist')
  cy.contains('h2', 'Page: Disable middleware').should('exist')

  cy.get('a[href="/en/recipes/fiery-chili-sauce"]').first().should('contain.text', 'Example: /en/recipes/fiery-chili-sauce')
  cy.get('a[href="/en/recipes/deep-mediterranean-quiche"]')
    .should('contain.text', 'Example: /en/recipes/deep-mediterranean-quiche')
})
