context('Flamegraph', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=appland-diagrams-flamegraph--flamegraph&viewMode=story'
    );
  });

  it('renders root', () => {
    cy.get('.d3-flame-graph').contains('root');
  });

  it('renders GET /admin/orders', () => {
    cy.get('.d3-flame-graph').contains('GET /admin/orders');
  });
});
