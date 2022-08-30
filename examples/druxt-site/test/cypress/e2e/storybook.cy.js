it('Umami: Homepage', () => {
  // Given I visit the Storybook index
  cy.visit('/')

  // I should be at the Druxt README story
  cy.url().should('contain', '?path=/story/druxt-readme--page')

  // And I should see a DruxtModule story
  const druxtModule = cy.get('#druxt-druxtmodule--page')
  druxtModule.should('contain.text', 'DruxtModule')

  // Then I click the DruxtModule story link
  druxtModule.click()

  // And I should be at the DruxtModule story
  cy.url().should('contain', '?path=/story/druxt-druxtmodule--page')

  // And I should see a DruxtDebug story group
  const druxtDebug = cy.get('#druxt-druxtdebug')
  druxtDebug.should('contain.text', 'DruxtDebug')

  // Then I click the DruxtDebug story link
  druxtDebug.click()

  // And I should be at the DruxtModule story
  cy.url().should('contain', '?path=/story/druxt-druxtdebug--default')

  // Then I click on the Docs tab.
  cy.get('button:contains("Docs")').click()

  // And I should be at the DruxtDebug docs page
  cy.url().should('contain', '?path=/docs/druxt-druxtdebug--default')

  // And I should see a Blocks story group
  const druxtBlocks = cy.get('#druxt-blocks')
  druxtBlocks.should('contain.text', 'Blocks')

  // Then I click on the Blocks story group
  druxtBlocks.click()

  // And I should see a DruxtBlock story group
  const druxtBlocksBlock = cy.get('#druxt-blocks-druxtblock')
  druxtBlocksBlock.should('contain.text', 'DruxtBlock')

  // And I click on the DruxtBlock story group
  druxtBlocksBlock.click()

  // And I should be at the DruxtBlock story group docs
  cy.url().should('contain', '?path=/docs/druxt-blocks-druxtblock--default')

  // Then I click on the Canvas tab.
  cy.get('button:contains("Canvas")').click()

  // And I should be at the DruxtBlock story group docs
  cy.url().should('contain', '?path=/story/druxt-blocks-druxtblock--default')

  // And I should see the ID prop control has 27 options
  cy.get('#control-id').should('exist').find('option').should('have.length', 27)

  // And I set the ID prop to 'umami_main_menu'
  cy.get('#control-id').select('umami_main_menu')
  cy.url().should('contain', '&args=id:umami_main_menu')

  // And I should see the Lang Code, UUID and Wrapper prop controls
  cy.get('#set-langcode').should('exist')
  cy.get('#control-uuid').should('exist')
  cy.get('#set-wrapper').should('exist')

  // And I should see a DruxtBlockRegion story group
  const druxtBlocksBlocRegion = cy.get('#druxt-blocks-druxtblockregion')
  druxtBlocksBlocRegion.should('contain.text', 'DruxtBlockRegion')

  // And I click on the DruxtBlockRegion story group
  druxtBlocksBlocRegion.click()

  // And I should be at the DruxtBlockRegion story group docs
  cy.url().should('contain', '?path=/story/druxt-blocks-druxtblockregion--default')

  // And I should see the name prop control has 15 options
  cy.get('#control-name').should('exist').find('option').should('have.length', 15)

  // And I should see the them prop control has 15 options
  cy.get('#control-theme').should('exist').find('option').should('have.length', 3)

  // And I set the name to footer and the theme to umami
  cy.get('#control-name').select('footer')
  cy.get('#control-theme').select('umami')
  cy.url().should('contain', '&args=name:footer;theme:umami')

  // Then I should see the DruxtBlocks Seven story group
  const druxtBlocksSeven = cy.get('#druxt-blocks-seven')
  druxtBlocksSeven.should('contain.text', 'Seven')

  // And I expand the DruxtBlocks Seven story group
  druxtBlocksSeven.click()

  // And I see the DruxtBlock Seven story group has 6 children
  cy.get('button[data-parent-id="druxt-blocks-seven"]').should('have.length', 6)
})
