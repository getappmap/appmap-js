context('Instruction Status', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--install-guide&viewMode=story');
  });

  it('works end to end', () => {
    cy.get(':nth-child(2) > .accordion__header').click();
    cy.get('.accordion--open [data-cy="status-indicator"] .completed').should('have.length', 0);
    cy.get('.accordion--open [data-cy="status-indicator"] .in-progress').should('have.length', 1);

    cy.get('.accordion--open [data-cy="automated-install"]').click();

    cy.get('.accordion--open [data-cy="status-indicator"] .completed').should('have.length', 1);
    cy.get('.accordion--open [data-cy="status-indicator"] .in-progress').should('have.length', 1);
    cy.get('.accordion--open [data-cy="status"] [data-cy="header"]').should(
      'contain.text',
      'AppMap is ready to map DjangoTest'
    );
    cy.get('.accordion--open [data-cy="next-step"]').click();
    cy.get('[data-cy="status"] [data-cy="header"]').contains(
      'No AppMaps have been recorded yet for DjangoTest'
    );
    // We can't test further because the next step just sends a message to the code editor
  });

  it('does not show the status bar for unsupported projects', () => {
    cy.get('.accordion--disabled').click();
    cy.get('.accordion--open [data-cy="status"]').should('not.exist');
  });
});
