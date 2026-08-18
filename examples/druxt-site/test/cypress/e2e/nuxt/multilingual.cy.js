// Multilingual behaviour, end to end. Everything this asserts was broken at
// some point and fixed deliberately: the language resolving from the
// requested path (decoupled_router #3111456, druxt #3273228 patches), the
// Spanish config translation collection landing at provision, and the
// language-prefixed JSON:API proxies. If any of it regresses, this spec is
// the alarm.
describe('Multilingual', () => {
  it('switches to Spanish from the language block and stays there', () => {
    cy.visit('/')

    // The language switcher offers both languages.
    const languageBlock = '[data-fetch-key^="DruxtBlockLanguageBlock"]'
    cy.get(languageBlock).find('li').should('have.length', 2)

    // Clicking Spanish lands on the Spanish front page - not back on /.
    cy.get(languageBlock).contains('a', 'Spanish').click()
    cy.url().should('include', '/es')

    // The view route resolved in Spanish: translated title, not "Home".
    cy.get('div[name="page_title"]').should('contain.text', 'Inicio')
  })

  it('serves the Spanish front page directly at /es', () => {
    cy.visit('/es')
    cy.url().should('include', '/es')

    // View config translations: title and the view header text.
    cy.get('div[name="page_title"]').should('contain.text', 'Inicio')
    cy.contains('Explore recetas').should('exist')

    // Menu config translations: the main menu links, defined by views
    // menu settings, translated via the language.es collection.
    cy.get('div[name="header"]').within(() => {
      cy.contains('a', 'Inicio').should('exist')
      cy.contains('a', 'Artículos').should('exist')
      cy.contains('a', 'Recetas').should('exist')
    })
  })

  it('resolves a Spanish node alias with translated content', () => {
    cy.visit('/es/recipes/quiche-mediterr%C3%A1neo-profundo')

    // The path holds - no bounce back to the English page.
    cy.url().should('include', '/es/recipes/')

    // Content entity translation.
    cy.contains('h1, h2', 'Quiche mediterráneo profundo').should('exist')
    cy.contains('Un quiche de inspiración italiana').should('exist')
  })

  it('keeps English behaviour intact at /en', () => {
    cy.visit('/en')
    cy.get('div[name="page_title"]').should('contain.text', 'Home')
    cy.contains('Explore recipes').should('exist')

    cy.get('div[name="header"]').within(() => {
      cy.contains('a', 'Articles').should('exist')
      cy.contains('a', 'Recipes').should('exist')
    })
  })

  // Known gap, asserted as such so a fix flips this test rather than
  // silently changing behaviour: druxt-schema keys schemas without a
  // language dimension and generates them against the default language, so
  // field labels render untranslated even on Spanish pages, while field
  // values translate. The day this shows "Tiempo de preparación", the gap
  // is fixed and this spec should assert translated labels everywhere.
  it('field labels still render untranslated on Spanish pages (known druxt-schema gap)', () => {
    cy.visit('/es/recipes/quiche-mediterr%C3%A1neo-profundo')
    cy.contains('strong', 'Preparation time').should('exist')
  })
})
