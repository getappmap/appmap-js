context('Trace', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=appland-diagrams-trace--trace&viewMode=story'
    );
  });

  function expandEvent(id) {
    return cy
      .get(`.trace-node[data-event-id="${id}"] ~ .trace-summary`)
      .click();
  }

  it('expands nodes', () => {
    expandEvent(9);
    expandEvent(138);

    cy.get('.trace-node[data-event-id="141"]')
      .click()
      .should('have.class', 'highlight');
  });

  it('clears selection after click on diagram background', () => {
    cy.get('.trace-node[data-event-id="1"]')
      .click()
      .should('have.class', 'highlight');

    cy.get('.trace').click();

    cy.get('.trace-node[data-event-id="1"]').should(
      'not.have.class',
      'highlight'
    );
  });
});
