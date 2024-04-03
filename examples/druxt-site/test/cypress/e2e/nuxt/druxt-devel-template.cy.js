/* global cy, it */

it('DruxtDevelTemplate tool', () => {
  // Given I visit the homepage.
  cy.visit('/')

  // Umami Search block.
  const searchBlock = '[data-fetch-key^="DruxtBlock:9ae71192-5a61-4ede-8a11-f92f543c1f4a:0"]'

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
