it('Examples: DruxtWrapper theming', () => {
  cy.visit('/examples/wrappers')

  cy.get('h1').should('have.text', 'DruxtWrapper examples')

  // Four wrapper-behaviour demonstrations, each in its own <details>.
  cy.get('details').should('have.length', 4)

  cy.contains('h2', 'DruxtEntity default').should('exist')
  cy.contains('h2', 'DruxtEntity with wrapper disabled').should('exist')
  cy.contains('h2', 'DruxtEntity using template injection, default wrapper').should('exist')
  cy.contains('h2', 'DruxtEntity using template injection with wrapper enabled').should('exist')

  // The template-injection examples dump the entity as JSON.
  cy.get('details').eq(2).find('pre code').should('contain.text', '"type": "node--page"')
  cy.get('details').eq(3).find('pre code').should('contain.text', '"type": "node--page"')
})
