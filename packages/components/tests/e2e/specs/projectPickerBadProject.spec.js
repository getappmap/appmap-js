context('Project Picker (Bad Project)', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages-project-picker--bad-project&args=&viewMode=story'
    );
  });

  it('displays a title', () => {
    cy.get('[data-cy="title"]').should('contain.text', 'Add AppMap to your project');
  });

  it('does not show empty state content', () => {
    cy.get('[data-cy="empty-state-content').should('not.exist');
  });

  it('selects project and does not show next button', () => {
    cy.get('[data-cy="next-button"]').should('not.exist');
  });

  it('selects project and does not show back button', () => {
    cy.get('[data-cy="back-button"]').should('not.exist');
  });

  it('selects project and does not show code snippet', () => {
    cy.get('[data-cy="code-snippet"]').should('not.exist');
  });

  it('selects project and does not show agent installed message', () => {
    cy.get('[data-cy="agent-installed-message"]').should('not.exist');
  });
});
