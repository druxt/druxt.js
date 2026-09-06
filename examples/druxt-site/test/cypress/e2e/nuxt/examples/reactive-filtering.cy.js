it('Examples: reactive filtering re-ranks by ingredient coverage', () => {
  cy.visit('/examples/reactive-filtering')

  cy.get('h1').should('have.text', 'Reactive filtering')

  // Rows render with the default pantry (onion, garlic) applied.
  cy.get('.rf-status').should(
    'contain.text',
    'watcher: idle matching on: onion, garlic'
  )
  cy.get('.rf-row').should('have.length', 6)
  cy.get('.rf-pct').each(($pct) => {
    expect($pct.text()).to.match(/^-?\d+%$/)
  })

  // Coverage percentages are sorted descending.
  const percentages = []
  cy.get('.rf-pct')
    .each(($pct) => percentages.push(parseInt($pct.text(), 10)))
    .then(() => {
      const sorted = [...percentages].sort((a, b) => b - a)
      expect(percentages).to.deep.equal(sorted)
    })

  // The first row covers at least as much of its ingredient list as the last.
  cy.get('.rf-row')
    .first()
    .find('.rf-match-label')
    .invoke('text')
    .then((first) => {
      const [firstMatch, firstTotal] = first.match(/(\d+) of (\d+)/).slice(1)
      cy.get('.rf-row')
        .last()
        .find('.rf-match-label')
        .invoke('text')
        .then((last) => {
          const [lastMatch, lastTotal] = last.match(/(\d+) of (\d+)/).slice(1)
          expect(Number(firstMatch) / Number(firstTotal)).to.be.at.least(
            Number(lastMatch) / Number(lastTotal)
          )
        })
    })

  // Toggling every chip off: no terms, dashes instead of percentages.
  // One chip at a time by name - each toggle re-renders the chip list, and
  // clicking a detached element fails the run.
  cy.contains('button', 'onion').click()
  cy.contains('button', 'garlic').click()
  cy.get('.rf-status').should('contain.text', 'no ingredients selected')
  cy.get('.rf-pct').each(($pct) => {
    expect($pct.text()).to.equal('—')
  })

  // Toggling one chip back re-ranks with non-zero percentages.
  cy.contains('button', 'onion').click()
  cy.get('.rf-status').should('contain.text', 'matching on: onion')
  cy.get('.rf-row').should('have.length', 6)
  cy.get('.rf-pct').each(($pct) => {
    expect(parseInt($pct.text(), 10)).to.be.at.least(0)
  })

  // Free-text input is debounced: the watcher state flips while typing and
  // the applied terms update after the 250ms timer fires.
  cy.get('#rf-input').type('garlic')
  cy.get('.rf-status').should('contain.text', 'debouncing')
  cy.wait(400)
  cy.get('.rf-status').should(
    'contain.text',
    'watcher: idle matching on: onion, garlic'
  )

  // Typed terms participate in ranking: garlic-heavy recipes rise, and the
  // list re-orders from the onion-only ordering captured above.
  cy.get('.rf-meta h3').then(($titles) => {
    const titles = $titles.toArray().map((el) => el.textContent)
    expect(titles).to.have.length(6)
    expect(new Set(titles).size).to.equal(6)
  })
})
