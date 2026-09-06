it('druxt-daisyui: Homepage header and theme toggle', () => {
  cy.visit('/')

  // No site-wide menu - Recipe Box is a focused tool, not a Druxt "Site"
  // (that's what examples/druxt-site demonstrates). The header is just the
  // logo and the theme toggle.
  cy.get('header img[alt="Umami"]').should('exist')
  cy.get('[data-fetch-key^="DruxtMenu"]').should('not.exist')

  // Defaults to the light theme.
  cy.get('[data-theme]').should('have.attr', 'data-theme', 'umami')

  // Toggling switches to the dark theme and persists it.
  cy.get('button[aria-label="Switch to dark theme"]').click()
  cy.get('[data-theme]').should('have.attr', 'data-theme', 'umami-dark')
  cy.reload()
  cy.get('[data-theme]').should('have.attr', 'data-theme', 'umami-dark')
})

it('druxt-daisyui: no leftover Site-model routes', () => {
  // The wildcard router is disabled (druxt.router.wildcard: false) - this
  // app has no page that resolves an arbitrary Drupal path, unlike
  // examples/druxt-site. Visiting one directly should not render a recipe.
  cy.request({ url: '/en/recipes/deep-mediterranean-quiche', failOnStatusCode: false }).then(
    (response) => {
      expect(response.status).not.to.equal(200)
    }
  )

  // The saved collection is a view toggle on `/`, not its own route or
  // langcode-prefixed page - it never existed as a separate URL.
  cy.request({ url: '/en/recipe-box', failOnStatusCode: false }).then((response) => {
    expect(response.status).not.to.equal(200)
  })
})
