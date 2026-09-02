// NOTE: unlike the Nuxt-based examples, this app is a client-rendered SPA
// (no SSR) - `data-fetch-key` attributes never exist in its DOM, so these
// specs assert on real rendered content instead of Druxt fetch keys.

it('druxt-tailwind: Meal Planner library, drag-and-drop, and derived totals', () => {
  cy.visit('/')

  // Header + shell - no site menu, this app is a single-purpose tool, not
  // a Druxt "Site" (that's what examples/druxt-site demonstrates).
  cy.get('h1').invoke('text').invoke('trim').should('equal', 'Meal Planner')
  cy.get('[data-fetch-key^="DruxtMenu"]').should('not.exist')

  // Library renders with category chips and styled thumbnails.
  cy.get('[data-testid="mp-row"]').its('length').should('be.gte', 10)
  cy.get('[data-testid="mp-chip"]').first().invoke('text').invoke('trim').should('equal', 'All')

  // Click-to-select then click-to-place (the touch/assistive path).
  cy.get('[data-testid="mp-row"]').first().click()
  cy.get('[data-testid="mp-selected-hint"]').should('exist')
  cy.get('[data-testid="mp-day"][data-day="Mon"]').click()
  cy.get('[data-testid="mp-item"][data-day="Mon"]').should('have.length', 1)
  cy.get('[data-testid="mp-week-count"]').invoke('text').invoke('trim').should('equal', '1')

  // Drag-and-drop places via the same store action.
  cy.get('[data-testid="mp-row"]').then(($row) => {
    const id = $row[0].dataset.id
    cy.get('[data-testid="mp-day"][data-day="Tue"]').then(($day) => {
      cy.window().then((win) => {
        const dt = new win.DataTransfer()
        dt.setData('text/plain', id)
        const opts = { bubbles: true, cancelable: true, dataTransfer: dt }
        $row[0].dispatchEvent(new win.DragEvent('dragstart', opts))
        $day[0].dispatchEvent(new win.DragEvent('dragenter', opts))
        $day[0].dispatchEvent(new win.DragEvent('dragover', opts))
        $day[0].dispatchEvent(new win.DragEvent('drop', opts))
        $row[0].dispatchEvent(new win.DragEvent('dragend', opts))
      })
    })
  })
  cy.get('[data-testid="mp-item"][data-day="Tue"]').should('have.length', 1)
  cy.get('[data-testid="mp-week-count"]').invoke('text').invoke('trim').should('equal', '2')

  // Totals and shopping list are derived and recalculate on removal.
  cy.get('[data-testid="mp-week-time"]').should('not.have.text', '0h 0m')
  cy.get('[data-testid="mp-shopping-item"]').its('length').should('be.gt', 0)
  cy.get('[data-testid="mp-remove"]').first().click()
  cy.get('[data-testid="mp-week-count"]').invoke('text').invoke('trim').should('equal', '1')
})

it('druxt-tailwind: no leftover Site-model routes', () => {
  // No wildcard route, no contact form, no generic recipe/article browsing
  // - this app has exactly one page.
  cy.visit('/en/recipes')
  cy.contains('h1', 'Not found').should('exist')

  cy.visit('/en/contact')
  cy.contains('h1', 'Not found').should('exist')
})

it('druxt-tailwind: category chips filter the library', () => {
  cy.visit('/')

  cy.get('[data-testid="mp-chip"][data-cat="All"]').click()
  cy.get('[data-testid="mp-row"]').then(($all) => {
    cy.get('[data-testid="mp-chip"][data-cat="Desserts"]').click()
    cy.get('[data-testid="mp-row"]').then(($desserts) => {
      expect($desserts.length).to.be.lessThan($all.length)
      expect($desserts.length).to.be.greaterThan(0)
    })
  })
})
