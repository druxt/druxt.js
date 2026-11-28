// The Umami home page, as any Umami backend serves it: the example backend
// in examples/drupal, or the Decoupled Drupal mock that `yarn test:e2e`
// starts. Nothing here names an entity's UUID, because a block's differs
// from one install to the next.
describe('Umami: Homepage', () => {
  beforeEach(() => {
    // Every language has a URL prefix, so the homepage is /en. The first
    // visit in a run compiles the dev bundle, which can far exceed the
    // default timeout on CI runners.
    cy.visit('/en', { timeout: 120000 })
  })

  it('lists both languages in the language switcher', () => {
    const languageBlock = '[data-fetch-key^="DruxtBlockLanguageBlock"]'

    cy.get(languageBlock, { timeout: 120000 })
      .find('li')
      .should('have.length', 2)
      .first()
      .should('have.text', 'English')

    cy.get(languageBlock)
      .find('li')
      .last()
      .should('have.text', 'Spanish')
  })

  it('offers a visitor the log in link in the account menu', () => {
    cy.get('[data-fetch-key^="DruxtMenu:account"]')
      .find('li')
      .should('have.length', 1)
      .first()
      .should('have.text', 'Log in')
  })

  it('renders a block through its wrapper component, not the debug template', () => {
    // The branding block is themed by
    // components/druxt/block/SystemBrandingBlockUmami.vue. A block that finds
    // no wrapper renders DruxtDebug's details element in its place.
    cy.get('.region-header').within(() => {
      cy.get('a img[alt="Umami"]').should('exist')
      cy.get('details summary').should('not.exist')
    })
  })
})
