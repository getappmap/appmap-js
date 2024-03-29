context('Project Picker', () => {
  describe('with a bad project', () => {
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

    it('shows that the project is unsupported', () => {
      cy.get('.header__support').should('contain.text', 'Unsupported');
    });
  });

  describe('with an unsupported project with no language property, web framework, or test framework', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=&id=pages-vs-code-install-guide-pages-project-picker--unsupported-project-with-no-language&viewMode=story'
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

    it('shows that the project is unsupported', () => {
      cy.get('.header__support').should('contain.text', 'Unsupported');
    });
  });
});
