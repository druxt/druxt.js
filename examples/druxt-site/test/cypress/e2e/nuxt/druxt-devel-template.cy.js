// This spec originally exercised the DruxtDevelTemplate tool against the
// Umami search block's missing-template debug UI. The theming pass then
// added components/druxt/block/SearchFormBlockUmami.vue, so that block can
// never show the debug UI again - the premise is gone. What remains worth
// pinning is the resolution itself: the block finds its wrapper and renders
// the real form. A purpose-built, permanently unthemed demo block for the
// devel-template tool belongs to the pattern examples overhaul.
it('Umami search block resolves its wrapper component', () => {
  cy.visit('/')

  // First spec in the run: the first visit compiles the dev bundle, which
  // can far exceed the default 4s timeout on CI runners.
  const searchBlock = '[data-fetch-key^="DruxtBlock:9ae71192-5a61-4ede-8a11-f92f543c1f4a:0"]'
  cy.get(searchBlock, { timeout: 120000 }).within(() => {
    // The themed form, not DruxtDebug's missing-template details.
    cy.get('input[type="search"], input[type="text"]').should('exist')
    cy.contains('button', 'Search').should('exist')
    cy.get('details summary').should('not.exist')
  })
})
