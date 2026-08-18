it('Examples: DruxtSchemaMixin on non-Drupal data', () => {
  cy.visit('/examples/schema')

  cy.get('h1').should('have.text', 'Custom component using DruxtSchemaMixin')

  // The mock body text is rendered through a node--page schema field.
  cy.get('pre code').should('contain.text', 'This body text comes from a plain JavaScript object')

  // Each rendered field has an expandable schema details block.
  cy.get('details summary').should('have.length.at.least', 1).and('contain.text', 'Field schema')
})
