it('druxt-daisyui: Recipe Box deck - save, skip, and persistence', () => {
  cy.window().then((win) => win.localStorage.clear())
  cy.visit('/')

  // The deck renders one card at a time with category chips.
  cy.get('[data-testid="rb-card"]').should('exist')
  cy.get('button').contains('All').should('exist')
  cy.get('[data-testid="rb-view-box"] span').should('have.text', '0')

  // Save button advances the deck and increments the badge.
  cy.get('[data-testid="rb-card"] h2').invoke('text').as('firstCard')
  cy.get('[data-testid="rb-save"]').click()
  cy.get('[data-testid="rb-toast"]').should('exist')
  cy.wait(400)
  cy.get('[data-testid="rb-card"] h2').then(function ($title) {
    expect($title.text()).not.to.equal(this.firstCard)
  })
  cy.get('[data-testid="rb-view-box"] span').should('have.text', '1')

  // Skip button advances without saving.
  cy.get('[data-testid="rb-card"] h2').invoke('text').as('secondCard')
  cy.get('[data-testid="rb-skip"]').click()
  cy.wait(400)
  cy.get('[data-testid="rb-card"] h2').then(function ($title) {
    expect($title.text()).not.to.equal(this.secondCard)
  })
  cy.get('[data-testid="rb-view-box"] span').should('have.text', '1')

  // Keyboard: ArrowLeft skips, ArrowRight saves - identical actions.
  cy.get('body').type('{leftarrow}')
  cy.wait(400)
  cy.get('[data-testid="rb-view-box"] span').should('have.text', '1')
  cy.get('body').type('{rightarrow}')
  cy.wait(400)
  cy.get('[data-testid="rb-view-box"] span').should('have.text', '2')

  // Pointer drag past the ~90px threshold commits a save; the SAVE stamp
  // appears once the card is dragged past 60px.
  cy.get('[data-testid="rb-card"]').then(($card) => {
    const { x, y, width } = $card[0].getBoundingClientRect()
    const startX = x + width / 2
    cy.get('[data-testid="rb-card"]')
      .trigger('pointerdown', { pointerId: 1, clientX: startX, clientY: y + 200 })
      .trigger('pointermove', { pointerId: 1, clientX: startX + 110, clientY: y + 200 })
      .contains('SAVE')
      .trigger('pointerup', { pointerId: 1, clientX: startX + 110, clientY: y + 200 })
  })
  cy.wait(400)
  cy.get('[data-testid="rb-view-box"] span').should('have.text', '3')

  // The saved collection survives a hard reload, with no backend involved.
  cy.reload()
  cy.get('[data-testid="rb-view-box"] span').should('have.text', '3')

  // The box view (same page, no route change) lists the saved recipes and
  // can remove them.
  cy.get('[data-testid="rb-view-box"]').click()
  cy.location('pathname').should('eq', '/')
  cy.get('[data-testid="rb-tile"]').should('have.length', 3)
  cy.get('[data-testid="rb-tile"] button[title="Remove"]').first().click()
  cy.get('[data-testid="rb-tile"]').should('have.length', 2)
  cy.reload()
  cy.get('[data-testid="rb-view-box"]').click()
  cy.get('[data-testid="rb-tile"]').should('have.length', 2)
})

it('druxt-daisyui: In-page detail panel saves to the same box', () => {
  cy.window().then((win) => win.localStorage.clear())
  cy.visit('/')

  // "Open" shows the full recipe in-page - no navigation, no route change,
  // matching the design brief ("the detail panel follows the top card")
  // rather than the wildcard-routed page this used to navigate to.
  cy.get('[data-testid="rb-card"] h2').invoke('text').as('cardTitle')
  cy.get('[data-testid="rb-open"]').click()
  cy.get('[data-testid="rdp-panel"]').should('be.visible')
  cy.get('[data-testid="rdp-panel"] [data-testid="rb-detail-save"]').should(
    'have.text',
    'Save to box'
  )
  cy.get('[data-testid="rdp-panel"] [data-testid="rb-detail-save"]').click()
  cy.get('[data-testid="rdp-panel"] [data-testid="rb-detail-save"]').should(
    'have.text',
    'Saved to box'
  )

  cy.get('[data-testid="rdp-close"]').click()
  cy.get('[data-testid="rdp-panel"]').should('not.exist')
  cy.get('[data-testid="rb-view-box"] span').should('have.text', '1')

  cy.get('[data-testid="rb-view-box"]').click()
  cy.get('[data-testid="rb-tile"]').should('have.length', 1)
  cy.get('@cardTitle').then((title) => {
    cy.get('[data-testid="rb-tile"] h2').should('contain.text', title)
  })

  // The box's own tiles open the same panel, not a page navigation either.
  cy.get('[data-testid="rb-tile"]').first().click()
  cy.get('[data-testid="rdp-panel"]').should('be.visible')
  cy.location('pathname').should('eq', '/')
})
