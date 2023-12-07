context('giant AppMap', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?args=scenario:giant&id=pages-vs-code--extension&viewMode=story'
    );
  });

  it('shows the correct notifications', () => {
    const notificationHeader = 'This AppMap is too large to open.';
    cy.get('[data-cy="giant-map-sidebar-notification"]')
      .should('be.visible')
      .should('include.text', notificationHeader);

    cy.get('[data-cy="giant-map-stats-notification"]')
      .should('be.visible')
      .should('include.text', notificationHeader);
  });

  it('does not show any control buttons except stats', () => {
    cy.get('[data-cy="stats-button"]').should('be.visible');
    cy.get('[data-cy="share-button"]').should('not.exist');
    cy.get('[data-cy="filter-button"]').should('not.exist');
    cy.get('[data-cy="reload-button"]').should('not.exist');
  });

  it('shows the stats panel and the stats panel cannot be closed', () => {
    cy.get('[data-cy="stats-panel"]').should('be.visible');
    cy.get('[data-cy="close-stats-button"]').click();
    cy.get('[data-cy="stats-panel"]').should('be.visible');
    cy.get('[data-cy="stats-button"]').click();
    cy.get('[data-cy="stats-panel"]').should('be.visible');
  });

  it('does not show any diagram content when clicking on tabs', () => {
    cy.get('.tab-btn').contains('Dependency').click();
    cy.get('.tab-content').should('not.exist');
    cy.get('[data-cy="stats-panel"]').should('be.visible');

    cy.get('.tab-btn').contains('Sequence').click({ force: true });
    cy.get('.tab-content').should('not.exist');
    cy.get('[data-cy="stats-panel"]').should('be.visible');

    cy.get('.tab-btn').contains('Trace').click();
    cy.get('.tab-content').should('not.exist');
    cy.get('[data-cy="stats-panel"]').should('be.visible');
  });
});
