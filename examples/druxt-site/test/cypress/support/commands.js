// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Capture console warnings
Cypress.Commands.add('captureConsoleWarn', () => {
  const warnings = []
  cy.window().then((win) => {
    const originalWarn = win.console.warn
    win.console.warn = (...args) => {
      warnings.push(args.join(' '))
      originalWarn.apply(win.console, args)
    }
    cy.wrap(warnings).as('consoleWarnings')
  })
})

// Get captured console warnings
Cypress.Commands.add('getConsoleWarnings', () => {
  return cy.get('@consoleWarnings')
})
