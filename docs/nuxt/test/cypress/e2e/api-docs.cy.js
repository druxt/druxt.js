it('DruxtJS.org: API documentation', () => {
  // Given I visit the homepage.
  cy.visit('/')

  // Then I click on "API documentation"
  cy.get('.hero .btn-primary').click()

  // And I should be on "/api"
  cy.url().should('include', '/api')

  // And I should see the "API Documentation" heading.
  cy.get('.text-4xl').should('have.text', 'API Documentation')
})
