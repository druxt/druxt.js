// Selectors here are semantic (roles, landmarks, link text) rather than
// utility classes. The previous suite asserted on `.hero`, `.navbar` and
// `.text-5xl`, which the redesign removed, so every spec failed at once.
it('DruxtJS.org: Homepage', () => {
  cy.visit('/')

  // The banner, with the search trigger and the version badge.
  cy.get('header').should('exist')
  cy.get('header').contains('button', 'Search docs').should('exist')
  cy.get('header').find('a.badge').should('contain', 'v')

  // The hero states what Druxt is, and offers the two calls to action.
  cy.get('h1').should('have.text', 'The Fully Decoupled Drupal Framework')
  cy.contains('a', 'Get started').should('have.attr', 'href', '/guide/getting-started')
  cy.contains('a', 'Browse modules').should('have.attr', 'href', '/modules')

  // The quickstart command is copyable.
  cy.contains('code', 'giget').should('exist')
  cy.contains('button', 'Copy').should('exist')

  // And the site footer is present on the homepage, not only on docs pages.
  cy.get('footer').contains('a', 'GitHub').should('exist')
})
