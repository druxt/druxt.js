/// <reference types="cypress" />

  beforeEach(() => {
    cy.request('GET','http://drupal-9.ddev.site/jsonapi').as('jsonapi')
    cy.visit('http://localhost:3000')
  })

  it('Has English and Spanish links.', () => {

    cy.get('[data-fetch-key="DruxtBlockLanguageBlock:0"]')
        .find('li')
        .should('have.length', 2)
        .first()
        .should('have.text', 'English')

    cy.get('[data-fetch-key="DruxtBlockLanguageBlock:0"]')
        .find('li')
        .last()
        .should('have.text', 'Spanish')

  })

  it('Create content type and test nodes using jsonapi.', () => {
    cy.get('@jsonapi')
  })

