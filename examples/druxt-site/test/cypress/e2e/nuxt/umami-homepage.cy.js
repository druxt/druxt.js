// These specs assert language-prefixed English (/en) routes, which only
// the full druxtjs.org site backend ships. The examples/drupal dev
// backend is a minimal umami install whose default language is
// unprefixed, so CI's e2e lane (CYPRESS_backendVariant=minimal) skips
// this file; the site backend's own pipeline runs it in full.
const describeFullBackend =
  Cypress.env('backendVariant') === 'minimal' ? describe.skip : describe

describeFullBackend('site-backend spec', () => {
it('Umami: Homepage', () => {
  // Given I visit the homepage. Every language has a URL prefix, so it is /en.
  cy.visit('/en')

  // Language Switcher block.
  const languageBlock = '[data-fetch-key^="DruxtBlockLanguageBlock"]'

  // I see an English link in the LanguageBlock.
  cy.get(languageBlock)
    .find('li')
    .should('have.length', 2)
    .first()
    .should('have.text', 'English')

  // And I see a Spanish link in the LanguageBlock.
  cy.get(languageBlock)
    .find('li')
    .last()
    .should('have.text', 'Spanish')

  // Account menu should have a login link.
  const accountMenu = '[data-fetch-key^="DruxtMenu:account"]'
  cy.get(accountMenu)
    .find('li')
    .should('have.length', 1)
    .first()
    .should('have.text', 'Log in')
})
})
