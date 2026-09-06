it('Examples: Entity explorer', () => {
  cy.visit('/examples/entity-explorer')

  cy.get('h1').should('have.text', 'DruxtJS Entity explorer')

  // Defaults to the node--recipe resource type.
  cy.get('select').first().should('have.value', 'node--recipe')

  // Generated code preview reflects the current selection.
  cy.get('pre code').should('contain.text', 'type="node--recipe"')

  // Live preview renders a DruxtEntity for the selected recipe.
  cy.druxtEntityRenders('node--recipe')
})
