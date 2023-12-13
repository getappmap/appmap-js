context('Collapsible sidebar', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
    );
  });

  it('can be collapsed and expanded', () => {
    cy.get('.details-panel__hide-panel-icon').click();
    cy.get('[data-cy="sidebar-menu"]').should('be.visible');
    cy.get('.details-search').should('not.exist');

    cy.get('.sidebar-menu__hamburger-menu').click();
    cy.get('.details-search').should('be.visible');
    cy.get('[data-cy="sidebar-menu"]').should('not.exist');
  });

  it('opens the sidebar when selecting a code object', () => {
    cy.get('.details-panel__hide-panel-icon').click();
    cy.get('span').contains('index').click();
    cy.get('.details-panel-header__details-name')
      .contains('Spree::Admin::RootController#index')
      .should('be.visible');
    cy.get('.selection-nav-menu')
      .find('option:selected')
      .should('contain.text', 'Spree::Admin::RootController#index');
  });
});
