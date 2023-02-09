context('Sequence Diagram', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=appland-diagrams-sequence--create-api-key&viewMode=story'
    );
  });

  it('renders', () => {
    cy.get('.sequence-diagram').children('.lane').should('have.length', 8);
  });
});
