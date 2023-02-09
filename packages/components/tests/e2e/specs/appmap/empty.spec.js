context('Empty AppMap', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=pages-vs-code-extension-empty--extension-empty&viewMode=story'
    );
  });

  it("shows 'empty' notice", () => {
    cy.get('.no-data-notice').should('exist');
  });
});
