context('pruned AppMap', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?args=scenario:pruned&id=pages-vs-code--extension&viewMode=story'
    );
  });

  it('shows the correct notifications', () => {
    const notificationHeader = 'This AppMap has been automatically trimmed.';
    cy.get('[data-cy="pruned-map-sidebar-notification"]')
      .should('be.visible')
      .should('include.text', notificationHeader);

    cy.get('[data-cy="stats-button"]').click();

    cy.get('[data-cy="pruned-map-stats-notification"]')
      .should('be.visible')
      .should('include.text', notificationHeader);
  });

  it('shows which functions were pruned', () => {
    cy.get('[data-cy="stats-button"]').click();
    cy.get('.stats-row').eq(1).find('.pruned-fqid').should('be.visible');
    cy.get('.stats-row').eq(1).find('svg').should('be.visible');

    // check that the second row is not pruned for this map
    cy.get('.stats-row').eq(2).find('.pruned-fqid').should('not.exist');
    cy.get('.stats-row').eq(2).find('svg').should('not.exist');

    cy.get('.stats-row').eq(3).find('.pruned-fqid').should('be.visible');
    cy.get('.stats-row').eq(3).find('svg').should('be.visible');
  });

  it('opens the stats panel from the sidebar notification', () => {
    cy.get('[data-cy="stats-panel"]').should('not.exist');
    cy.get('[data-cy="stats-panel-link"]').click();
    cy.get('[data-cy="stats-panel"]').should('be.visible');
  });
});
