it('Examples: DruxtMenu frontend editing', () => {
  cy.visit('/examples/menu-edit')

  cy.get('h1').should('have.text', 'DruxtMenu - Frontend editing')

  // The main menu renders at least the stock demo_umami links (a given
  // backend may have more, so assert presence rather than an exact list).
  const mainMenu = cy.get('[data-fetch-key^="DruxtMenu:main"]')
  for (const label of ['Home', 'Articles', 'Recipes']) {
    mainMenu.find('li').should('contain.text', label)
  }

  // Editing is off by default; toggling shows the reorder controls and the
  // JSON:API payload preview.
  cy.contains('button', '🔓 Enable editing').click()
  cy.contains('button', '🔒 Lock editing').should('exist')
  cy.contains('h2', 'JSON:API payload preview').should('exist')
  cy.get('pre code').should('contain.text', '"type"')
})
