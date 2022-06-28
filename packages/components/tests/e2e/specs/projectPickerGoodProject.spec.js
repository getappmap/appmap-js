context('Project Picker (Good Project)', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages--project-picker-good-project&viewMode=story'
    );
  });

  it('displays a title', () => {
    cy.get('[data-cy="title"]').should('contain.text', 'Install AppMap');
  });

  it('does not show empty state content', () => {
    cy.get('[data-cy="empty-state-content').should('not.exist');
  });

  it('selects project and shows next button', () => {
    cy.get('[data-cy="next-button"]').should('be.visible');
  });

  it('selects project and shows back button', () => {
    cy.get('[data-cy="back-button"]').should('be.visible');
  });

  it('selects project and shows code snippet', () => {
    cy.get('[data-cy="code-snippet"]').should('be.visible');
  });

  it('selects project and shows agent installed message', () => {
    cy.get('[data-cy="agent-installed-message"]').should('be.visible');
  });
});
