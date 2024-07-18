context('AppMap sidebar', () => {
  const width = 390;
  const height = 844;

  beforeEach(() => {
    cy.viewport(width, height);
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
  });

  it('should not display the sidebar', () => {
    cy.get('[data-cy="sidebar-menu"]').should('be.visible');
  });

  it('can scroll the tabs', () => {
    cy.get('[data-cy="tabs"]').scrollTo('right');
    cy.get('[data-cy="tabs"]').scrollTo('left');
  });

  it('displays a full screen filters modal', () => {
    cy.get('[data-cy="filters-button"]').click();
    cy.get('[data-cy="filters-menu"]').should('be.visible');
    cy.get('[data-cy="filters-menu"]').invoke('outerHeight').should('be.equal', height);
    cy.get('[data-cy="filters-close"]').click();
    cy.get('[data-cy="filters-menu"]').should('not.exist');
  });

  it('hides non-responsive content', () => {
    cy.get('[data-cy="stats-button"]').should('not.be.visible');
    cy.get('[data-cy="instructions-button"]').should('not.be.visible');
  });
});
