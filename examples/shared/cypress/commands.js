/**
 * Shared Cypress custom commands for DruxtJS example apps.
 *
 * Import from an app's support file, e.g.:
 *   import '../../../shared/cypress/commands'
 */

import { byFetchKey } from './utils/selectors'

/**
 * Assert that a `DruxtEntity` component for the given resource type (and
 * optional UUID) has rendered non-empty content.
 *
 * @example
 *   cy.druxtEntityRenders('node--recipe')
 *   cy.druxtEntityRenders('node--recipe', recipeUuid)
 */
Cypress.Commands.add('druxtEntityRenders', (type, uuid) => {
  const prefix = uuid ? `DruxtEntity:${type}:${uuid}` : `DruxtEntity:${type}`
  return cy.get(byFetchKey(prefix)).should('exist').and('not.be.empty')
})

/**
 * Assert that a `DruxtMenu` component named `name` renders exactly the
 * given item labels, in order.
 *
 * @example
 *   cy.druxtMenuHasItems('account', ['Log in'])
 */
Cypress.Commands.add('druxtMenuHasItems', (name, items) => {
  const menu = cy.get(byFetchKey(`DruxtMenu:${name}`))
  menu.find('li').should('have.length', items.length)
  items.forEach((label, index) => {
    menu.find('li').eq(index).should('contain.text', label)
  })
  return menu
})

/**
 * Assert that the given path's breadcrumb trail matches `trail` (an
 * ordered array of label strings, root first).
 *
 * @example
 *   cy.druxtBreadcrumbTrailIs(['Home', 'Recipes', 'Deep mediterranean quiche'])
 */
Cypress.Commands.add('druxtBreadcrumbTrailIs', (trail) => {
  const breadcrumb = cy.get(byFetchKey('DruxtBreadcrumb'))
  breadcrumb.find('li').should('have.length', trail.length)
  trail.forEach((label, index) => {
    breadcrumb.find('li').eq(index).should('contain.text', label)
  })
  return breadcrumb
})
