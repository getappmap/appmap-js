context('Instruction Status', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--install-guide&viewMode=story');
  });

  it('works end to end', () => {
    cy.get(':nth-child(2) > .accordion__header').click();
    cy.get('.accordion--open [data-cy="status-indicator"] .completed').should('have.length', 1);
    cy.get('.accordion--open [data-cy="status-indicator"] .in-progress').should('have.length', 1);
    cy.get('.accordion--open [data-cy="status"] [data-cy="header"]').should(
      'contain.text',
      'AppMap has been added to DjangoTest'
    );
    cy.get('.accordion--open [data-cy="next-step"]').click();
    cy.get('[data-cy="status"] [data-cy="header"]').contains(
      'No AppMaps have been recorded yet for DjangoTest'
    );
    cy.get('#record-appmaps [data-cy="next-button"]').click();
    cy.get('#open-appmaps [data-cy="status"] [data-cy="prompt"]').contains('Go back and record');
    cy.get('#open-appmaps [data-cy="go-back"]').click();
    cy.get('[data-cy="status"] [data-cy="header"]').contains(
      'No AppMaps have been recorded yet for DjangoTest'
    );
  });

  it('does not show the status bar for unsupported projects', () => {
    cy.get('.accordion--disabled').click();
    cy.get('.accordion--open [data-cy="status"]').should('not.exist');
  });
});
