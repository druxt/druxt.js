it('Examples: DruxtEntity query settings', () => {
  cy.visit('/examples/entity-queries')

  cy.get('h1').should('have.text', 'DruxtEntity query settings')

  // Five DruxtEntity output blocks: defaults, schema filtering, field
  // filtering, related-resource include, and query settings as a property.
  cy.get('details').should('have.length', 5)

  cy.get('details').eq(0).find('pre code').should('contain.text', '"type": "node--page"')
  cy.get('details').eq(1).find('pre code').should('contain.text', '"type": "node--article"')
  cy.get('details').eq(2).find('pre code').should('contain.text', '"type": "node--recipe"')
  cy.get('details').eq(3).find('pre code').should('contain.text', '"type": "node--recipe"')
  cy.get('details').eq(4).find('pre code').should('contain.text', '"type": "node--page"')
})
