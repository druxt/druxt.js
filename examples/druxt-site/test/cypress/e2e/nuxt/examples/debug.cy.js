it('Examples: DruxtDebug component', () => {
  cy.visit('/examples/debug')

  cy.get('h1').should('have.text', 'DruxtDebug component examples')

  // Three DruxtDebug usages on the page, each rendered as a <details>.
  cy.get('details').should('have.length', 3)

  cy.get('details').eq(0).find('summary').should('contain.text', 'Debug')
  cy.get('details').eq(1).find('summary').should('contain.text', 'Debug summary')
  cy.get('details').eq(2).find('pre code').should('contain.text', '"one": true')
})
