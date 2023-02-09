context('AppMap sequence diagram', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
    );
  });

  context('when it is the default view', () => {
    it('opens as the initial view', () => {
      cy.get('.sequence-diagram').children('.lane').should('have.length', 9);
    });
  });
});
