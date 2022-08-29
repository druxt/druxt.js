it('DruxtJS.org: Get started', () => {
  // Given I visit the homepage.
  cy.visit('/')

  // Then I click on "Get Started"
  cy.get('.hero .btn-secondary').click()

  // And I should be on "/guide"
  cy.url().should('include', '/guide')

  // And I should see the "Guide" heading.
  cy.get('.text-4xl').should('have.text', 'Guide')
})
