it('Umami: Homepage', () => {
  // Given I visit the homepage.
  cy.visit('/')

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
