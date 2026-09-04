it('DruxtJS.org: Get started', () => {
  cy.visit('/')

  cy.contains('a', 'Get started').click()

  cy.url().should('include', '/tutorials/getting-started')
  cy.get('h1').should('have.text', 'Getting started with Druxt')

  // Exactly one h1: the page header renders the frontmatter title, and the
  // markdown body no longer repeats it.
  cy.get('h1').should('have.length', 1)

  // Docs pages carry breadcrumbs and an edit link.
  cy.get('nav[aria-label="Breadcrumb"]').should('contain', 'Tutorials')
  cy.contains('a', 'Edit this page on GitHub').should('exist')
})
