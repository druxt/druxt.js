it('druxt-bootstrapvue: Content console renders table, filters, and sorting', () => {
  cy.visit('/')

  // Dark sidebar with brand and a signed-out login affordance. Content /
  // Recipes / Articles / Taxonomy - no Menus (not implemented), no generic
  // Site-model surface (that's what examples/druxt-site demonstrates).
  cy.get('.coc-sidebar').should('exist')
  cy.get('[data-testid="coc-login"]').should('exist')
  cy.get('[data-testid="coc-nav-item"]').should('have.length', 4)
  cy.get('[data-testid="coc-nav-item"]').should('not.contain.text', 'Menus')

  // Topbar: title, item count, no unsaved edits yet, no error banner.
  cy.get('h1').should('have.text', 'Content')
  cy.get('.coc-count').should('contain.text', 'of')
  cy.get('.coc-topbar .small.text-muted').should('contain.text', 'no local edits')
  cy.get('[data-testid="coc-banner"]').should('not.exist')

  // The placeholder decodes to a real ellipsis - Vue's runtime compiler
  // leaves HTML entities in attribute values as literal text.
  cy.get('[data-testid="coc-search"]').should('have.attr', 'placeholder', 'Filter…')

  // Filter controls share a bottom edge - Bootstrap's label margin
  // otherwise drops the button 8px below the search input.
  cy.get('[data-testid="coc-search"]').then(($input) => {
    cy.get('[data-testid="coc-issues"]').should(($button) => {
      expect($button[0].getBoundingClientRect().bottom, 'filter alignment').to.equal(
        $input[0].getBoundingClientRect().bottom
      )
    })
  })

  // Dense table: both recipes and articles, recipes editable.
  cy.get('[data-testid="coc-row"]').its('length').should('be.gte', 14)
  cy.get('[data-testid="coc-row"] select').its('length').should('be.gt', 0)
  cy.get('[data-testid="coc-row"] input[type="number"]').its('length').should('be.gt', 0)

  // The sidebar nav narrows to recipes only, then articles only - a real
  // click-driven nav, not a dropdown that happens to look like one.
  cy.get('[data-nav="Recipes"]').click()
  cy.get('[data-nav="Recipes"]').should('have.class', 'coc-nav-active')
  cy.get('h1').should('have.text', 'Recipes')
  cy.get('[data-testid="coc-row"]').each(($row) => cy.wrap($row).should('contain.text', 'Recipe'))

  cy.get('[data-nav="Articles"]').click()
  cy.get('h1').should('have.text', 'Articles')
  cy.get('[data-testid="coc-row"]').each(($row) => cy.wrap($row).should('contain.text', 'Article'))

  cy.get('[data-nav="Content"]').click()
  cy.get('h1').should('have.text', 'Content')

  // Search filters by title.
  cy.get('[data-testid="coc-search"]').clear().type('quiche')
  cy.get('[data-testid="coc-row"]').should('contain.text', 'quiche')
  cy.get('[data-testid="coc-search"]').clear()

  // "Needs attention only" hides healthy rows.
  cy.get('[data-testid="coc-issues"]').click()
  cy.get('[data-testid="coc-row"]').should('exist')
  cy.get('[data-testid="coc-row"] .badge-warning').its('length').should('be.gt', 0)
  cy.get('[data-testid="coc-issues"]').click()

  // Issue badges render for flagged rows ("no difficulty"/"thin body").
  cy.get('[data-testid="coc-row"] .badge-warning').should('exist')

  // Title sort: ascending first, then toggles back while rows persist.
  cy.get('[data-testid="coc-sort-title"]').click()
  cy.get('[data-testid="coc-row"]').first().should('contain.text', 'A')
  cy.get('[data-testid="coc-sort-title"]').click()
  cy.get('[data-testid="coc-row"]').its('length').should('be.gte', 14)

  // Changed dates are formatted for scannability (d MMM yyyy).
  cy.get('[data-testid="coc-row"]')
    .first()
    .invoke('text')
    .should('match', /\d{1,2} [A-Z][a-z]{2} \d{4}/)
})

it('druxt-bootstrapvue: Taxonomy section - recipe categories and tags, no leftover Site-model routes', () => {
  cy.visit('/')
  cy.get('[data-testid="coc-row"]').should('exist')

  cy.get('[data-nav="Taxonomy"]').click()
  cy.get('[data-nav="Taxonomy"]').should('have.class', 'coc-nav-active')
  cy.get('h1').should('have.text', 'Taxonomy')

  // Both vocabularies render as editable name fields, same optimistic
  // single-cell pattern as Content - same patchCell() method, a different
  // resource type.
  cy.get('[data-testid="coc-term-row"]').its('length').should('be.gt', 10)
  cy.get('[data-testid="coc-term-row"] .coc-type').should('contain.text', 'Category')
  cy.get('[data-testid="coc-term-row"] .coc-type').should('contain.text', 'Tag')
  cy.get('[data-testid="coc-term-name"]').first().invoke('val').should('not.be.empty')

  // Search narrows the taxonomy list too.
  cy.get('[data-testid="coc-search"]').clear().type('dessert')
  cy.get('[data-testid="coc-term-row"]').should('have.length.gte', 1)
  cy.get('[data-testid="coc-search"]').clear()

  // No wildcard router, no generic recipe/article page - this app's only
  // reachable surface is the console itself.
  cy.request({ url: '/en/recipes/deep-mediterranean-quiche', failOnStatusCode: false }).then(
    (response) => {
      expect(response.status).not.to.equal(200)
    }
  )
})

it('druxt-bootstrapvue: an unauthenticated edit surfaces the failure path', () => {
  // Editable controls render regardless of auth state (patchCell itself is
  // what's gated, by Drupal rejecting the PATCH) - so attempting an edit
  // while signed out is a real, not simulated, way to exercise the error
  // banner + Retry/Revert without needing a full OAuth login in Cypress.
  cy.visit('/')
  cy.get('[data-testid="coc-login"]').should('exist')

  // The sidebar tells a signed-out visitor exactly what to type - this is
  // an OAuth2 login against a real backend, not a mocked auth state, so
  // the credentials need to be discoverable in the UI itself.
  cy.get('[data-testid="coc-test-creds"]')
    .should('be.visible')
    .and('contain.text', 'admin')
    .and('contain.text', 'druxt123')

  // The full-record modal maps DruxtEntityForm's classless Drupal markup
  // onto the Bootstrap form look (bare inputs get browser-default
  // borders otherwise).
  cy.get('[data-testid="coc-open-modal"]').first().click()
  cy.get('[data-testid="coc-modal"] input:not([type])', { timeout: 10000 }).should(
    'have.css',
    'border-bottom-color',
    'rgb(206, 212, 218)'
  )
  cy.get('.modal-content .close').click()

  cy.get('[data-testid="coc-row"] input[type="number"]')
    .first()
    .clear()
    .type('42')
    .blur()

  cy.get('[data-testid="coc-banner"]', { timeout: 10000 }).should('be.visible')
  cy.get('[data-testid="coc-retry"]').should('exist')
  cy.get('[data-testid="coc-revert"]').click()
  cy.get('[data-testid="coc-banner"]').should('not.exist')
})
