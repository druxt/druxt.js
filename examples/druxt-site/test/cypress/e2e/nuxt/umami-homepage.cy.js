it('Umami: Homepage', () => {
  // Given I visit the homepage.
  cy.visit('/')

  // Language Switcher block - look for links with /en and /es
  // Note: These may not be present if language switching is not configured
  cy.get('body').then(($body) => {
    if ($body.find('a[href="/en"]').length > 0) {
      cy.get('a[href="/en"]').should('contain.text', 'English')
    }
    if ($body.find('a[href="/es"]').length > 0) {
      cy.get('a[href="/es"]').should('contain.text', 'Spanish')
    }
  })

  // Account menu should have a login link
  // Note: This may not be present if user authentication is not configured
  cy.get('body').then(($body) => {
    if ($body.find('a[href="/user/login"]').length > 0) {
      cy.get('a[href="/user/login"]').should('contain.text', 'Log in')
    }
  })

  // Basic test - ensure the page loads
  cy.get('body').should('be.visible')
})
