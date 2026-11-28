// The tool a Druxt component shows, in development, when no theme component
// renders it: the names a theme component could take, and a button that asks
// the dev server to create one.
describe('Examples: DruxtDevelTemplate', () => {
  beforeEach(() => {
    cy.visit('/examples/devel-template')
    cy.get('h1').should('have.text', 'DruxtDevelTemplate examples')
  })

  it('lists the theme component names an unthemed component could take', () => {
    cy.contains('details summary', 'Missing default slot').parent('details').within(() => {
      // Most specific first.
      cy.get('select option').should('have.length', 2)
      cy.get('select option').first().should('have.text', 'DruxtExampleNoticeWarning')
      cy.get('select option').last().should('have.text', 'DruxtExampleNoticeDefault')
      cy.contains('button', 'Create').should('exist')
    })
  })

  it('asks the dev server to create the component that is chosen', () => {
    // Answered here, so the run doesn't write a file into the example.
    cy.intercept('POST', '/_druxt/template/add', { statusCode: 200, body: {} }).as('create')

    // The panel is closed until its summary is clicked.
    cy.contains('details summary', 'Missing default slot').click()
    cy.contains('details summary', 'Missing default slot').parent('details').within(() => {
      cy.get('select').select('DruxtExampleNoticeDefault')
      cy.contains('button', 'Create').click()
    })

    cy.wait('@create').its('request.body').should((body) => {
      expect(body.path).to.equal('DruxtExampleNoticeDefault')
      expect(body.settings.component).to.equal('DruxtExampleNotice')
      expect(body.settings.props).to.deep.include({ key: 'kind', type: 'string' })
    })
  })
})
