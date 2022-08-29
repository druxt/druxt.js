it('DruxtJS.org: Modules', () => {
  // Given I visit the homepage.
  cy.visit('/')

  // Then I click on "Modules"
  cy.get('.hero .btn-accent').click()

  // And I should be on "/modules"
  cy.url().should('include', '/modules')

  // And I should see the "Modules" heading.
  cy.get('.text-4xl').should('have.text', 'Modules')
})
