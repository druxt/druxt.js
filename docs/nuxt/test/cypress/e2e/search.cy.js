it('DruxtJS.org: Search', () => {
  cy.visit('/')

  // The palette opens from the header trigger.
  cy.get('header').contains('button', 'Search docs').click()
  cy.get('[role="dialog"]').should('be.visible')

  // Typing returns grouped results for a known module.
  cy.get('input[role="combobox"]').type('entity')
  cy.get('[role="option"]').should('have.length.greaterThan', 0)

  // The result count is announced, not just rendered.
  cy.get('[role="status"]').should('contain', 'result')

  // Arrow keys move the selection, and it is exposed to assistive tech.
  cy.get('input[role="combobox"]').type('{downarrow}')
  cy.get('input[role="combobox"]')
    .should('have.attr', 'aria-activedescendant')
    .and('match', /^search-option-/)

  // Enter navigates to the highlighted result.
  cy.get('input[role="combobox"]').type('{enter}')
  cy.get('[role="dialog"]').should('not.exist')
  cy.url().should('not.equal', Cypress.config().baseUrl + '/')
})
