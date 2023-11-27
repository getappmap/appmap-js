context('AppMap sequence diagram with slow load', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?args=&id=pages-vs-code--extension-with-slow-load&viewMode=story'
    );
  });

  it('correctly sets the initial collapse depth', () => {
    cy.get('.depth-text').should('contain.text', '3');
  });
});
