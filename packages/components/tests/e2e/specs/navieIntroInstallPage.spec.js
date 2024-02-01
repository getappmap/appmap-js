describe('Navie Introduction page', () => {
  context('with appmaps', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=&id=pages-vs-code-install-guide-pages-navie-introduction--with-appmaps&viewMode=story'
      );
    });

    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('contain.text', 'AppMap Navie');
    });

    it('shows back button', () => {
      cy.get('[data-cy="back-button"]').should('be.visible');
    });

    it('does not show a next button', () => {
      cy.get('[data-cy="next-button"]').should('not.exist');
    });

    it('has a button to open Navie', () => {
      cy.get('[data-cy="open-navie-button"]').should('be.visible');
    });
  });

  context('without appmaps', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=&id=pages-vs-code-install-guide-pages-navie-introduction--no-appmaps&viewMode=story'
      );
    });

    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('contain.text', 'AppMap Navie');
    });

    it('shows back button', () => {
      cy.get('[data-cy="back-button"]').should('be.visible');
    });

    it('does not show a next button', () => {
      cy.get('[data-cy="next-button"]').should('not.exist');
    });

    it('shows a button to record appmaps', () => {
      cy.get('[data-cy="record-appmaps-button"]').should('be.visible');
    });
  });
});
