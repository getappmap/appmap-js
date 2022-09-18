context('Investigate Findings (Empty)', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages-investigate-findings--empty&args=&viewMode=story'
    );
  });

  it('displays a title', () => {
    cy.get('[data-cy="title"]').should('contain.text', 'AppMap Runtime Analysis');
  });

  it('does not show different types of findings', () => {
    cy.get('[data-cy="security"]').should('not.exist');
    cy.get('[data-cy="performance"]').should('not.exist');
    cy.get('[data-cy="stability"]').should('not.exist');
    cy.get('[data-cy="maintainability"]').should('not.exist');
  });

  it('should not display a button to investigate findings', () => {
    cy.get('[data-cy="investigate-findings-button"]').should('not.exist');
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
