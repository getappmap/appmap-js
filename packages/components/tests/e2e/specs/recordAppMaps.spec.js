context('Record AppMaps', () => {
  const pageTitle = 'Record AppMaps';

  describe('Automated recording available', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages-record-appmaps--rails-rspec&args=&viewMode=story'
      );
    });

    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('contain.text', pageTitle);
    });

    it('shows next button', () => {
      cy.get('[data-cy="next-button"]').should('be.visible');
    });

    it('shows back button', () => {
      cy.get('[data-cy="back-button"]').should('be.visible');
    });

    it('displays a status indicator', () => {
      cy.get('[data-cy="status-message"]').should('be.visible');
    });
  });

  function testUnsupported() {
    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('contain.text', pageTitle);
    });

    it('displays the documentation', () => {
      cy.get('[data-cy="documentation-link"]').should('be.visible');
    });

    it('shows next button', () => {
      cy.get('[data-cy="next-button"]').should('be.visible');
    });

    it('shows back button', () => {
      cy.get('[data-cy="back-button"]').should('be.visible');
    });

    it('displays a status indicator', () => {
      cy.get('[data-cy="status-message"]').should('be.visible');
    });
  }

  describe('No supported web or test framework', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages-record-appmaps--no-web-or-test-framework&args=&viewMode=story'
      );
    });

    testUnsupported();
  });

  describe('Unsupported language', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages-record-appmaps--unsupported-language&args=&viewMode=story'
      );
    });

    testUnsupported();
  });
});
