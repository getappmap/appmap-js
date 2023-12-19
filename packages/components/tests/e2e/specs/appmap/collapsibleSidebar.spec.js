context('Collapsible sidebar', () => {
  context('on a large device', () => {
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

  context('on a medium-sized device', () => {
    const width = 690;
    const height = 844;

    beforeEach(() => {
      cy.viewport(width, height);
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
      );
    });

    it('correctly resets the diagram', () => {
      cy.get('.diagram-reload').click();
      cy.get('.main-column--left').invoke('outerWidth').should('be.lt', 60).and('be.gt', 0);
    });
  });

  context('on a small device', () => {
    const width = 500;
    const height = 844;

    beforeEach(() => {
      cy.viewport(width, height);
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
      );
    });

    it('makes the sidebar menu full screen', () => {
      cy.get('.sidebar-menu__hamburger-menu').click();
      cy.get('.main-column--left').invoke('outerWidth').should('eq', width);
    });
  });
});
