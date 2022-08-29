it('DruxtJS.org: Search', () => {
  // Given I visit the homepage.
  cy.visit('/')

  // Then I open the menu.
  cy.get('.navbar > :nth-child(1) > .btn').click()

  // And I search for "Entity".
  cy.get('.input').type('Entity')

  // @TODO - Assert results.
})
