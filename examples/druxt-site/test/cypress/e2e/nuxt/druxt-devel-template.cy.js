/* global cy, it */

it('DruxtDevelTemplate tool', () => {
  // Given I visit the homepage.
  cy.visit('/')

  // Umami Search block.
  const searchBlock = '[data-fetch-key^="DruxtBlock:dc9cc806-d5d5-4187-af7a-f9d5b13fea8b:0"]'

  // I see a DruxtDebug component.
  cy.get(searchBlock)
    .find('details summary')
    .first()
    .should('contain.text', "[DruxtBlock] Missing Vue template for the 'umami_search' block")
    .click()

  // It has 5 theme component options.
  cy.get(searchBlock)
    .find('select option')
    .should('have.length', 5)

  // I create the DruxtBlockSearchFormBlock component
  cy.get(searchBlock)
    .find('select')
    .select('DruxtBlockSearchFormBlock')
  cy.get(searchBlock)
    .find('button')
    .click()

  // cy.wait(5000)
  // cy.get(searchBlock)
  //   .find('details summary')
  //   .first()
  //   .should('contain.text', "[DruxtBlockSearchFormBlock] Debug")
  //   .click()
})
