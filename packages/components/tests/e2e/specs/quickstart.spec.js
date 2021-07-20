context('Quickstart', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=pages-vs-code--quickstart&viewMode=story'
    );
  });

  it('contains 4 steps', () => {
    cy.get('.qs-head__step').should('contain.text', 'step 1/4');
  });

  it('switches between steps', () => {
    cy.get('.qs-title').should('contain.text', 'Install AppMap Agent');
    cy.get('.qs-button').contains('Install the AppMap agent').click();
    cy.wait(1000).get('.qs-step__success-next-step').click();

    cy.get('.qs-title').should('contain.text', 'Configure AppMap');
    cy.get('.qs-button').contains('Create appmap.yml config file').click();
    cy.wait(1000).get('.qs-step__success-next-step').click();

    cy.get('.qs-title').should('contain.text', 'Record AppMaps');
    cy.get('.qs-button').contains('Run tests to create AppMaps').click();
    cy.wait(1000).get('.qs-step__success-next-step').click();

    cy.get('.qs-title').should('contain.text', 'Open AppMaps');

    cy.get('.qs-head__btn-wrap').first().click();
    cy.get('.qs-title').should('contain.text', 'Record AppMaps');
  });

  it('completes all steps', () => {
    cy.get('.qs-title').should('contain.text', 'Install AppMap Agent');
    cy.get('.qs-button').contains('Install the AppMap agent').click();
    cy.get('.qs-loader').should('be.visible');
    cy.wait(1000)
      .get('.qs-step__success-title')
      .should('contain.text', 'Agent installed');
    cy.get('.qs-step__success-next-step').click();

    cy.get('.qs-title').should('contain.text', 'Configure AppMap');
    cy.get('.qs-button').contains('Create appmap.yml config file').click();
    cy.get('.qs-loader').should('be.visible');
    cy.wait(1000)
      .get('.qs-step__success-title')
      .should('contain.text', 'AppMap configuration file created');
    cy.get('.qs-step__success-next-step').click();

    cy.get('.qs-title').should('contain.text', 'Record AppMaps');
    cy.get('.qs-button').contains('Run tests to create AppMaps').click();
    cy.get('.qs-loader').should('be.visible');
    cy.wait(1000).get('.qs-step__success-next-step').click();

    cy.get('.qs-title').should('contain.text', 'Open AppMaps');
  });
});
