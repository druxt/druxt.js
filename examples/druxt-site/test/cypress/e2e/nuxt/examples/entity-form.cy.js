it('Examples: DruxtEntityForm', () => {
  cy.visit('/examples/entity-form')

  cy.get('h1').should('have.text', 'DruxtEntityForm example:')
  cy.get('h2').should('have.text', 'Contact form - Basic')

  // The contact_message--feedback form renders.
  cy.druxtEntityRenders('contact_message--feedback')

  // DruxtEntityFormButtons renders real Submit/Reset buttons.
  cy.get('button#submit').should('contain.text', 'Submit')
  cy.get('button#reset').should('contain.text', 'Reset')
})
