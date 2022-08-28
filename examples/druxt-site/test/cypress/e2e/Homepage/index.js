/* globals cy */
import { Given, Then } from '@badeball/cypress-cucumber-preprocessor'

Given('I visit the homepage', () => cy.visit('/'))
Then('I see "#__nuxt" element', () => cy.get('#__nuxt').should('exist'))
