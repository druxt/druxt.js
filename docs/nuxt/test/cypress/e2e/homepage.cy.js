it('DruxtJS.org: Homepage', () => {
  // Given I visit the homepage.
  cy.visit('/')

  // I should see the Navbar
  cy.get('.navbar').should('exist')

  // And I should see the Hero block
  // And have a heading of DruxtJS
  cy.get('.hero').should('exist')
    .find('.text-5xl').should('have.text', 'DruxtJS')

  // And I should see the CTAs:
  // - Get Started
  cy.get('.hero .btn-secondary').should('have.text', 'Get started')
  // - Druxt Modules
  cy.get('.hero .btn-accent').should('have.text', 'Druxt modules')
  // - API Documentation
  cy.get('.hero .btn-primary').should('have.text', 'API documentation')
})
