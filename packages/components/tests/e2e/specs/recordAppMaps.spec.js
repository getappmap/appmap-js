context('Project Picker (Good Project)', () => {
  const pageTitle = 'Record AppMaps';

  describe('Automated recording available', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages-record-appmaps--automated-recording&args=&viewMode=story'
      );
    });

    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('contain.text', pageTitle);
    });

    it('displays the automatic recording message', () => {
      cy.get('[data-cy="automatic-recording-single"]').should('not.exist');
      cy.get('[data-cy="automatic-recording-multi"]')
        .should('be.visible')
        .contains('Rails')
        .parent()
        .contains('RSpec');
    });

    it('contains a link to the documentation', () => {
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
  });

  describe('Automated recording (no test framework available)', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages-record-appmaps--no-test-framework&args=&viewMode=story'
      );
    });

    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('contain.text', pageTitle);
    });

    it('displays the automatic recording message', () => {
      cy.get('[data-cy="automatic-recording-single"]')
        .should('be.visible')
        .contains('Rails')
        .parent()
        .should('not.contain.text', 'RSpec');
      cy.get('[data-cy="automatic-recording-multi"]').should('not.exist');
    });

    it('contains a link to the documentation', () => {
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
  });

  describe('Automated recording (no web framework available)', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages-record-appmaps--no-web-framework&args=&viewMode=story'
      );
    });

    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('contain.text', pageTitle);
    });

    it('displays the automatic recording message', () => {
      cy.get('[data-cy="automatic-recording-single"]').should('be.visible').contains('Minitest');
      cy.get('[data-cy="automatic-recording-multi"]').should('not.exist');
    });

    it('contains a link to the documentation', () => {
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
  });

  describe('JavaScript and Java', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages-record-appmaps--javascript-or-java&args=&viewMode=story'
      );
    });

    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('contain.text', pageTitle);
    });

    it('displays the npx command', () => {
      cy.get('[data-cy="automatic-recording-single"]').should('not.exist');
      cy.get('[data-cy="automatic-recording-multi"]').should('not.exist');
      cy.get('[data-cy="code-snippet"]').should('be.visible');
    });

    it('contains a link to the documentation', () => {
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
  });

  function testUnsupported() {
    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('contain.text', pageTitle);
    });

    it('displays nothing but the documentation', () => {
      cy.get('[data-cy="automatic-recording-single"]').should('not.exist');
      cy.get('[data-cy="automatic-recording-multi"]').should('not.exist');
      cy.get('[data-cy="code-snippet"]').should('not.exist');
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
