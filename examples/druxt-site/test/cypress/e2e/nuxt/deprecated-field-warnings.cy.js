it('Deprecated Field Components: Render and Warnings', () => {
  // Visit the test page with deprecated field components
  // Set up console warning capture before the page loads
  cy.visit('/test-deprecated-warnings', {
    onBeforeLoad: (win) => {
      const originalWarn = win.console.warn
      win.capturedWarnings = []

      win.console.warn = (...args) => {
        win.capturedWarnings.push(args)
        return originalWarn.apply(win.console, args)
      }
    },
  })

  // Wait for the page to load
  cy.get('h1').should('contain', 'Test Deprecated Field Components')

  // Wait for the deprecated components container to be present
  cy.get('[data-cy="deprecated-components-container"]', {
    timeout: 10000,
  }).should('exist')

  // Give components time to mount and emit warnings
  cy.wait(2000)

  // Verify that deprecated components are rendering correctly
  cy.get('[data-cy="deprecated-components-container"]').within(() => {
    // Check that DruxtFieldTextDefault renders content
    cy.contains('Test content').should('be.visible')

    // Check that DruxtFieldTextTrimmed renders content
    cy.contains('This is a long text that should be trimmed.').should(
      'be.visible'
    )

    // Check that DruxtFieldNumberInteger renders formatted numbers
    // The numbers are rendered with prefix/suffix spans, so check for individual parts
    cy.contains('$').should('be.visible')
    cy.contains('42').should('be.visible')
    cy.contains('24').should('be.visible')
    cy.contains('12').should('be.visible')
    cy.contains('.00').should('be.visible')

    // Check that DruxtFieldLink renders
    cy.contains('Test Link').should('be.visible')
  })

  // Verify that console deprecation warnings were emitted
  // Each deprecated component emits one warning on mount (4 total)
  cy.window().then((win) => {
    cy.log('Captured warnings count:', win.capturedWarnings.length)

    // Convert args arrays to strings
    const warningMessages = win.capturedWarnings.map((args) => args.join(' '))
    cy.log('Warning messages:', warningMessages)

    // Filter only the deprecated component warnings
    const deprecatedWarnings = warningMessages.filter(
      (w) =>
        w.includes('[druxt-entity]') && w.includes('component is deprecated')
    )

    cy.log('Deprecated warnings count:', deprecatedWarnings.length)
    cy.log('Deprecated warnings:', deprecatedWarnings)

    // Check that all expected warning types are present (may have duplicates due to SSR/client mounting)
    expect(deprecatedWarnings.some((w) => w.includes('DruxtFieldTextDefault')))
      .to.be.true
    expect(deprecatedWarnings.some((w) => w.includes('DruxtFieldTextTrimmed')))
      .to.be.true
    expect(
      deprecatedWarnings.some((w) => w.includes('DruxtFieldNumberInteger'))
    ).to.be.true
    expect(deprecatedWarnings.some((w) => w.includes('DruxtFieldLink'))).to.be
      .true

    // Ensure we have at least the 4 expected types
    expect(deprecatedWarnings.length).to.be.at.least(4)
  })

  // Note: Server is left running for other tests
})
