context('Sequence Diagram', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=pages-vs-code--extension-with-sequence-diff&viewMode=story'
    );
  });

  it('opens as the initial view', () => {
    cy.get('.sequence-diagram').should('exist');
  });

  it('displays a diff deletion', () => {
    cy.get('.sequence-diagram .diff-delete').should('exist');
    cy.get('.sequence-diagram .diff-delete .name').contains('render').should('exist');
  });

  it('unchanged calls are collapsed', () => {
    cy.get('.sequence-diagram [data-event-ids="42"]').should('exist');
    cy.get('.sequence-diagram [data-event-ids="42"]').contains('show').should('exist');

    cy.get('.sequence-diagram [data-event-ids="42"] .collapse-expand').should('exist');
    cy.get('.sequence-diagram [data-event-ids="42"] .collapse-expand').should(
      'have.class',
      'collapsed'
    );
  });

  it('first diff element is selected', () => {
    cy.get('.sequence-diagram [data-event-ids="108"]').should('exist');
    cy.get('.sequence-diagram [data-event-ids="108"]').should('have.class', 'diff-delete');
    cy.get('.sequence-diagram [data-event-ids="108"]').should('have.class', 'focused');
  });

  it('exanding a package actor is disabled', () => {
    cy.get('.sequence-actor[data-actor-id="package:app/views"]').should('exist');
    cy.get('.sequence-actor[data-actor-id="package:app/views"]')
      .contains('.expand-actor')
      .should('not.exist');
  });

  it('hiding an actor is disabled', () => {
    cy.get('.sequence-actor[data-actor-id="package:app/views"]').should('exist');
    cy.get('.sequence-actor[data-actor-id="package:app/views"]')
      .contains('.hide-container')
      .should('not.exist');
  });
});
