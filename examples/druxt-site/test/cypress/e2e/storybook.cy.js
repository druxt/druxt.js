beforeEach(() => {
  cy.visit('/')
  cy.wait(2000)
})

it('Storybook: DruxtJS', () => {
  // Expect to be on the Druxt README page.
  cy.url().should('contain', '?path=/story/druxt-readme--page')

  // Test the DruxtModule story.
  cy.get('#druxt-druxtmodule--page').should('contain.text', 'DruxtModule')
  cy.get('#druxt-druxtmodule--page').click()
  cy.url().should('contain', '?path=/story/druxt-druxtmodule--page')

  // Test the DruxtDebug story.
  cy.get('#druxt-druxtdebug').should('contain.text', 'DruxtDebug')
  cy.get('#druxt-druxtdebug').click()
  cy.url().should('contain', '?path=/story/druxt-druxtdebug--default')

  // Open the Docs tab.
  cy.get('button:contains("Docs")').click()
  cy.url().should('contain', '?path=/docs/druxt-druxtdebug--default')
})

it('Storybook: Blocks', () => {
  // Test the root Blocks group.
  cy.get('#druxt-blocks').should('contain.text', 'Blocks')
  cy.get('#druxt-blocks').click()

  // Test the DruxtBlock group.
  cy.get('#druxt-blocks-druxtblock').should('contain.text', 'DruxtBlock')
  cy.get('#druxt-blocks-druxtblock').click()
  cy.url().should('contain', '?path=/story/druxt-blocks-druxtblock--default')
  cy.get('#control-id').should('exist').find('option').should('have.length', 27)
  cy.get('#control-id').select('umami_main_menu')
  cy.url().should('contain', '&args=id:umami_main_menu')
  cy.get('#set-langcode').should('exist')
  cy.get('#control-uuid').should('exist')
  cy.get('#set-wrapper').should('exist')

  // Test the DruxtBlockRegion group.
  cy.get('#druxt-blocks-druxtblockregion').should('contain.text', 'DruxtBlockRegion')
  cy.get('#druxt-blocks-druxtblockregion').click()
  cy.url().should('contain', '?path=/story/druxt-blocks-druxtblockregion--default')
  cy.get('#control-name').should('exist').find('option').should('have.length', 15)
  cy.get('#control-theme').should('exist').find('option').should('have.length', 3)

  // Set the block region to the umami footer.
  cy.get('#control-name').select('footer')
  cy.get('#control-theme').select('umami')
  cy.url().should('contain', '&args=name:footer;theme:umami')

  // Test the DruxtBlocks Seven story group.
  cy.get('#druxt-blocks-seven').should('contain.text', 'Seven')
  cy.get('#druxt-blocks-seven').click()
  cy.get('[data-parent-id="druxt-blocks-seven"]').should('have.length', 6)

  // Test the DruxtBlocks Seven Header region story group.
  cy.get('#druxt-blocks-seven-header').should('contain.text', 'Header')
  cy.get('#druxt-blocks-seven-header').click()
  cy.get('[data-parent-id="druxt-blocks-seven-header"]').should('have.length', 3)
  cy.get('button[data-parent-id="druxt-blocks-seven-header"]:first').click()
  cy.get('[data-selected="true"]').should('have.text', 'DruxtBlock')
  cy.get('[data-parent-id="druxt-blocks-seven-header"]:last').click()
  cy.get('[data-selected="true"]').should('have.text', 'DruxtBlockRegion')
})

it('Storybook: Router', () => {
  // Test the root Router group.
  cy.get('#druxt-router').should('contain.text', 'Router')
  cy.get('#druxt-router').click()

  // Test the DruxtRouter group.
  cy.get('#druxt-router-druxtrouter').should('contain.text', 'DruxtRouter')
  cy.get('#druxt-router-druxtrouter').click()
  cy.url().should('contain', '?path=/story/druxt-router-druxtrouter--default')
  cy.get('#control-path').should('exist')
  cy.get('#set-langcode').should('exist')
  cy.get('#set-wrapper').should('exist')

  // Set path
  cy.get('#control-path').type('articles')

  // Open the Docs tab.
  cy.get('button:contains("Docs")').click()
  cy.url().should('contain', '?path=/docs/druxt-router-druxtrouter--default')
})

it('Storybook: Breadcrumb', () => {
  // Test the root Breadcrumb group.
  cy.get('#druxt-breadcrumb').should('contain.text', 'Breadcrumb')
  cy.get('#druxt-breadcrumb').click()

  // Test the DruxtBreadcrumb group.
  cy.get('#druxt-breadcrumb-druxtbreadcrumb').should('contain.text', 'DruxtBreadcrumb')
  cy.get('#druxt-breadcrumb-druxtbreadcrumb').click()
  cy.url().should('contain', '?path=/story/druxt-breadcrumb-druxtbreadcrumb--default')
  cy.get('#set-home').should('exist')
  cy.get('#set-langcode').should('exist')
  cy.get('#set-path').should('exist')
  cy.get('#set-wrapper').should('exist')

  // Open the Docs tab.
  cy.get('button:contains("Docs")').click()
  cy.url().should('contain', '?path=/docs/druxt-breadcrumb-druxtbreadcrumb--default')
})

it('Storybook: Entity', () => {
  // Test the root Entity group.
  cy.get('#druxt-entity').should('contain.text', 'Entity')
  .should('contain.text', 'Entity').click()

  // Test the DruxtEntity group.
  cy.get('#druxt-entity-druxtentity').should('contain.text', 'DruxtEntity')
  cy.get('#druxt-entity-druxtentity').click()
  cy.url().should('contain', '?path=/story/druxt-entity-druxtentity--default')
  cy.get('#set-langcode').should('exist')
  cy.get('#set-mode').should('exist')
  cy.get('#control-schemaType').should('exist')
  cy.get('#set-settings').should('exist')
  cy.get('#control-type').should('exist')
  cy.get('#set-uuid').should('exist')
  cy.get('#set-wrapper').should('exist')
  cy.get('#set-input').should('exist')

  // View the "About Umami" page.
  cy.get('#control-type').select('node--page')
  cy.get('#set-uuid').click()
  cy.get('#control-uuid').type('cd44fe14-86ae-4853-8e22-7b1b73cd98f5')

  // Open the Docs tab.
  cy.get('button:contains("Docs")').click()
  cy.url().should('contain', '?path=/docs/druxt-entity-druxtentity--default')

  // Test the DruxtEntityForm group.
  cy.get('#druxt-entity-druxtentityform').should('contain.text', 'DruxtEntityForm')
  cy.get('#druxt-entity-druxtentityform').click()
  cy.get('button:contains("Canvas")').click()
  cy.url().should('contain', '?path=/story/druxt-entity-druxtentityform--default')
  // cy.get('#set-langcode').should('exist')
  cy.get('#set-mode').should('exist')
  cy.get('#set-settings').should('exist')
  cy.get('#control-type').should('exist')
  cy.get('#set-uuid').should('exist')
  // cy.get('#set-wrapper').should('exist')
  cy.get('#set-input').should('exist')
  cy.get('#set-reset').should('exist')
  cy.get('#set-submit').should('exist')
  cy.get('#set-error').should('exist')

  // Edit the "About Umami" page.
  cy.get('#control-type').select('node--page')
  cy.get('#set-uuid').click()
  cy.get('#control-uuid').type('cd44fe14-86ae-4853-8e22-7b1b73cd98f5')

  // Test the Node group.
  cy.get('#druxt-entity-node').should('contain.text', 'Node')
  cy.get('#druxt-entity-node').click()
  cy.get('[data-parent-id="druxt-entity-node"]').should('have.length', 3)
  cy.get('[data-parent-id="druxt-entity-node"]:last').should('have.text', 'Recipe')
  cy.get('[data-parent-id="druxt-entity-node"]:last').click()

  // Test view displays.
  cy.get('#druxt-entity-node-recipe-view-displays').should('exist')
  cy.get('#druxt-entity-node-recipe-view-displays').click()
  cy.get('#control-mode').select('card')
  cy.get('#control-uuid').select('Vegan chocolate and nut brownies (444d06fc-f4bc-435e-9892-d7e719957ecc)')

  // Test view displays.
  cy.get('#druxt-entity-node-recipe-form-displays').should('exist')
  cy.get('#druxt-entity-node-recipe-form-displays').click()
  cy.get('#control-uuid').select('Vegan chocolate and nut brownies (444d06fc-f4bc-435e-9892-d7e719957ecc)')
})

it('Storybook: Menu', () => {
  // Test the root Menu group.
  cy.get('#druxt-menu').should('contain.text', 'Menu')
  cy.get('#druxt-menu').click()
  cy.get('[data-parent-id="druxt-menu"]').should('have.length', 6)

  // Test the DruxtMenu group.
  cy.get('#druxt-menu-druxtmenu').should('contain.text', 'DruxtMenu')
  cy.get('#druxt-menu-druxtmenu').click()
  cy.url().should('contain', '?path=/story/druxt-menu-druxtmenu--default')
  cy.get('[data-parent-id="druxt-menu-druxtmenu"]').should('have.length', 3)
  cy.get('#control-name').should('exist')
  cy.get('#set-langcode').should('exist')
  cy.get('#set-wrapper').should('exist')
  cy.get('#control-name').select('Footer')

  // Test the User account menu.
  cy.get('#druxt-menu-user-account-menu--default').should('contain.text', 'User account menu')
  cy.get('#druxt-menu-user-account-menu--default').click()

  // Open the Docs tab.
  cy.get('button:contains("Docs")').click()
  cy.url().should('contain', '?path=/docs/druxt-menu-user-account-menu--default')
})

it('Storybook: Views', () => {
  // Test the root View group.
  cy.get('#druxt-views').should('contain.text', 'Views')
  cy.get('#druxt-views').click()
  cy.get('[data-parent-id="druxt-views"]').should('have.length', 7)

  // Test the DruxtView group.
  cy.get('#druxt-views-druxtview').should('contain.text', 'DruxtView')
  cy.get('#druxt-views-druxtview').click()
  cy.url().should('contain', '?path=/story/druxt-views-druxtview--default')
  cy.get('[data-parent-id="druxt-views-druxtview"]').should('have.length', 3)
  cy.get('#set-arguments').should('exist')
  cy.get('#set-displayId').should('exist')
  cy.get('#set-langcode').should('exist')
  cy.get('#set-type').should('exist')
  cy.get('#control-uuid').should('exist')
  cy.get('#control-viewId').should('exist')
  cy.get('#set-wrapper').should('exist')
  cy.get('#control-viewId').select('Frontpage (frontpage)')

  // Test the Recipes view.
  cy.get('#druxt-views-recipes').should('contain.text', 'Recipes')
  cy.get('#druxt-views-recipes').click()
  cy.get('#control-displayId').select('page_1')
})

it('Storybook: Site', () => {
  // Test the root Site group.
  cy.get('#druxt-site').should('contain.text', 'Site')
  cy.get('#druxt-site').click()
  cy.get('[data-parent-id="druxt-site"]').should('have.length', 2)
  cy.get('[data-parent-id="druxt-site"]:last').should('have.text', 'Themes')

  // Test the DruxtSite group.
  cy.get('#druxt-site-druxtsite').should('contain.text', 'DruxtSite')
  cy.get('#druxt-site-druxtsite').click()
  cy.url().should('contain', '?path=/story/druxt-site-druxtsite--default')
  cy.get('[data-parent-id="druxt-site-druxtsite"]').should('have.length', 3)
  cy.get('#set-langcode').should('exist')
  cy.get('#control-theme').should('exist')
  cy.get('#set-wrapper').should('exist')
  cy.get('#control-theme').select('seven')

  // Test the Themes group
  cy.get('#druxt-site-themes').should('contain.text', 'Themes')
  cy.get('#druxt-site-themes').click()
  cy.get('[data-parent-id="druxt-site-themes"]').should('have.length', 2)

  // Test the Seven site.
  cy.get('#druxt-site-themes-seven--default').should('contain.text', 'Seven')
  cy.get('#druxt-site-themes-seven--default').click()

  // Open the Docs tab.
  cy.get('button:contains("Docs")').click()
  cy.url().should('contain', '?path=/docs/druxt-site-themes-seven--default')
})
