context('Flamegraph', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=appland-diagrams-flamegraph--flamegraph&viewMode=story'
    );
  });

  it('renders root', () => {
    cy.get('.flamegraph-root').contains('default title');
  });

  it('renders GET /admin/orders', () => {
    cy.get('.flamegraph-item').contains('GET /admin/orders');
  });
});
