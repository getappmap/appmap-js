context('Empty AppMap', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension-empty&viewMode=story');
  });

  it("shows 'empty' notice", () => {
    cy.get('[data-cy="notice-no-data"]').should('exist');
  });
});
