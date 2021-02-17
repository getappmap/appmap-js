context('Flow View', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=appland-diagrams-flow--flow&viewMode=story'
    );
  });

  it('renders', () => {
    cy.get('.appmap__flow-view .node').should('have.length', 248);
  });

  it('displays poppers', () => {
    cy.get('.column.left .item.has-data').first().click();
    cy.get('.appmap__flow-view-popper[data-placement="left"]').should(
      'be.visible'
    );
  });
});
