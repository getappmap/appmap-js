context('Investigate Findings (10 findings)', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages-investigate-findings--with-findings&args=&viewMode=story'
    );
  });

  it('displays a title', () => {
    cy.get('[data-cy="title"]').should(
      'contain.text',
      'AppMap Runtime Analysis'
    );
  });

  it('shows the correct number of each type of finding', () => {
    cy.get('[data-cy="security"]').should('contain.text', '1');
    cy.get('[data-cy="performance"]').should('contain.text', '3');
    cy.get('[data-cy="stability"]').should('contain.text', '4');
    cy.get('[data-cy="maintainability"]').should('contain.text', '2');
  });

  it('should display a button to investigate findings', () => {
    cy.get('[data-cy="investigate-findings-button"]').should('be.visible');
  });

  it('shows next button', () => {
    cy.get('[data-cy="next-button"]').should('be.visible');
  });

  it('shows back button', () => {
    cy.get('[data-cy="back-button"]').should('be.visible');
  });

  it('does not show Slack signup button', () => {
    cy.get('[data-cy="slack-button"]').should('not.exist');
  });

  it('does not show runtime analysis info', () => {
    cy.get('[data-cy="runtime-analysis-info"]').should('not.exist');
  });
});
