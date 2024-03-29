context('Chat search', () => {
  context('with AppMaps', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=&id=pages-chatsearch--chat-search-mock&viewMode=story'
      );
      cy.viewport(1280, 720);
    });

    it('switches AppMaps', () => {
      cy.get('[data-cy="chat-input"]', { timeout: 25000 }).type('Hello world{enter}');

      // Ruby AppMap
      cy.get('.tabs .tab-btn').contains('Dependency Map').click();

      cy.get('[data-cy="appmap"] [data-id="GET /admin"]', {
        timeout: 10000,
      }).should('be.visible');

      // Java AppMap
      cy.get('[data-cy="appmap-list"]').select('Create Visit For Pet');
      cy.get('.tabs .tab-btn').contains('Dependency Map').click();
      cy.get('[data-cy="appmap"] [data-id="org/springframework/samples/petclinic/owner"]').should(
        'be.visible'
      );
    });

    it('selects multiple objects in the AppMap', () => {
      cy.get('[data-cy="chat-input"]', { timeout: 25000 }).type('Hello world{enter}');

      // open Dependency Map
      cy.get('.tabs .tab-btn').contains('Dependency Map').click();

      // Initial state
      cy.get('[data-cy="appmap"] [data-id="GET /admin"].highlight');

      // expand the details panel
      cy.get('.sidebar-menu__hamburger-menu').click();

      cy.get('[data-cy="select-object"]').select(0);
      cy.get(
        '[data-cy="appmap"] [data-id="app/controllers/Spree::Admin::OrdersController"].highlight'
      );

      cy.get('[data-cy="select-object"]').select(1);
      cy.get('[data-cy="appmap"] [data-id="GET /admin"].highlight');
    });

    it('new chat button clears the state', () => {
      cy.get('[data-cy="chat-input"]', { timeout: 25000 }).type('Hello world{enter}');

      // open Dependency Map
      cy.get('.tabs .tab-btn').contains('Dependency Map').click();

      // Ruby AppMap should be visible
      cy.get('[data-cy="appmap"] [data-id="GET /admin"]', {
        timeout: 10000,
      }).should('be.visible');

      cy.get('[data-cy="new-chat-btn"]').click();

      // Ruby AppMap should not be visible
      cy.get('[data-cy="appmap"] [data-id="GET /admin"]', {
        timeout: 10000,
      }).should('not.exist');
    });

    it('shows all toolbar icons', () => {
      cy.get('[data-cy="chat-input"]', { timeout: 25000 }).type('Hello world{enter}');

      // expand the details panel
      cy.get('.sidebar-menu__hamburger-menu').click();

      // verify that the details panel is visible to ensure that the toolbar width is narrow
      cy.get('.details-panel').should('be.visible');

      // verify that the stats, refresh, and fullscreen buttons are visible
      cy.get('.control-button')
        .should('have.length', 3)
        .each(($el) => cy.wrap($el).should('be.visible'));

      // verify that the filters button is visible
      cy.get('[data-cy="filters-button"]').should('be.visible');
    });

    it('does not show the context status when AppMaps are available and the user is chatting', () => {
      cy.get('[data-cy="status-bar"]').should('be.visible');
      cy.get('[data-cy="chat-input"]', { timeout: 25000 }).type('Hello world{enter}');
      cy.get('[data-cy="status-bar"]').should('not.exist');
    });
  });

  context('without AppMaps', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=&id=pages-chatsearch--chat-search-mock-search-prepopulated-empty-results&viewMode=story'
      );
      cy.viewport(1280, 720);
    });

    it('shows the context status when AppMaps are not available and the user is chatting', () => {
      cy.get('[data-cy="status-bar"]').should('be.visible');
      cy.get('[data-cy="chat-input"]', { timeout: 25000 }).type('Hello world{enter}');
      cy.get('.button-panel').should('be.visible');
      cy.get('[data-cy="status-bar"]').should('be.visible');
    });
  });
});
