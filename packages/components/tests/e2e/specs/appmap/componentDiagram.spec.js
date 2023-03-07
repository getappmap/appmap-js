context('AppMap component diagram', () => {
  context('with HTTP events', () => {
    beforeEach(() => {
      cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
    });

    it('is displayed initially', () => {
      cy.get('.appmap__component-diagram .output')
        .children('.nodes')
        .should('contain', 'app/controllers');
    });

    it('clears when "Clear selection" button was clicked', () => {
      cy.get(`.nodes .node[data-type="http"]`).click().should('have.class', 'highlight');

      cy.get('.details-panel__buttons').contains('Clear selection').click();

      cy.get(`.nodes .node[data-type="http"]`).should('not.have.class', 'highlight');
    });

    xit('expands package when a child is selected from the sidebar', () => {
      cy.get('.node[data-id="app/helpers"]').click();

      cy.get('.v-details-panel-list').within(() => {
        cy.get('.list-item').first().click();
      });

      cy.get('.cluster[data-id="app/helpers"]').should('have.length', 1);
    });

    it('clicking HTTP server requests displays the correct data', () => {
      cy.get('.details-search').should('be.visible');

      cy.get(`.node[data-type="http"]`).click().should('have.class', 'highlight');

      cy.get('.details-panel-header').should('contain.text', 'HTTP server requests');

      cy.get('.v-details-panel-list')
        .should('contain.text', 'Routes')
        .children()
        .should('contain.text', 'GET /admin', 'GET /admin/orders', 'GET /admin/orders/:id/edit');
    });

    it('clicking a package displays the correct data', () => {
      cy.get('.details-search').should('be.visible');

      cy.get('.node[data-id="app/controllers"]').click().should('have.class', 'highlight');

      cy.get('.details-panel-header').should('contain.text', 'app/controllers');

      cy.get('.v-details-panel-list')
        .should('contain.text', 'Classes', 'Inbound connections', 'Outbound connections')
        .children()
        .should(
          'contain.text',
          'OrdersController',
          'RootController',
          'GET /admin',
          'GET /admin/orders',
          'GET /admin/orders/:id/edit',
          'SELECT'
        );
    });

    it('clicking a class displays the correct data', () => {
      cy.get('.details-search').should('be.visible');

      cy.get('.node[data-id="active_support/ActiveSupport::SecurityUtils"]')
        .click()
        .should('have.class', 'highlight');

      cy.get('.details-panel-header').should(
        'contain.text',
        'Class',
        'SecurityUtils',
        'View source'
      );

      cy.get('.v-details-panel-list')
        .should('contain.text', 'Functions')
        .should('contain.text', 'Inbound connections')
        .should('contain.text', 'Outbound connections')
        .should('contain.text', 'secure_compare')
        .invoke('text')
        .should('match', /Digest::Instance#digest\s+24/)
        .should('match', /GET \/admin\/orders\s+8/)
        .should('match', /GET \/admin\/orders\/:id\/edit\s+4/);
    });

    it('clicking the database displays the correct data', () => {
      cy.get('.details-search').should('be.visible');

      cy.get(`.node[data-type="database"]`).click().should('have.class', 'highlight');

      cy.get('.details-panel-header').should('contain.text', 'Database');

      cy.get('.v-details-panel-list')
        .should('contain.text', 'Inbound connections')
        .should('contain.text', 'Queries')
        .should('contain.text', 'Spree::Admin::OrdersController#edit')
        .should('contain.text', 'SELECT COUNT')
        .should('contain.text', 'SELECT $1 AS')
        .invoke('text')
        .should('match', /GET \/admin\/orders\s+?10/)
        .should('match', /GET \/admin\/orders\/:id\/edit\s+30/);
    });

    it('clicking an edge displays the correct data', () => {
      cy.get('.details-search').should('be.visible');

      cy.get('.edgePath[data-from-type="http"][data-to="app/helpers"]')
        .should('have.css', 'opacity', '1')
        .click({ x: 3, y: 3 })
        .should('have.class', 'highlight');

      cy.get('.details-panel-header')
        .should('contain.text', 'Edge')
        .should('contain.text', 'HTTP server requests to app/helpers');

      cy.get('.v-details-panel-list')
        .should('contain.text', 'Events')
        .children('ul')
        .children()
        .should('have.length', 35);
    });

    it('clicking an event displays the correct data', () => {
      cy.get('.details-search').should('be.visible');

      cy.get('.tabs .tab-btn').last().click();

      // Verify the trace view renders as expected
      cy.get('.trace').should('be.visible');
      cy.get('.trace .trace-node').should('have.length', 4);

      cy.get('.trace-node[data-event-id="11"]').click();
      cy.get('.details-panel-header')
        .should('contain.text', 'Event')
        .should('contain.text', 'GET /admin/orders');

      cy.get('.event-params')
        .should('contain.text', 'Parameters')
        .invoke('text')
        .should('match', /String\s+controller\s+spree\/admin\/orders/)
        .should('match', /String\s+action\s+index/);

      cy.get('.event-params')
        .should('contain.text', 'HTTP response')
        .invoke('text')
        .should('match', /status\s+200/)
        .should('match', /mime_type\s+text\/html; charset=utf-8/);

      cy.get('.v-details-panel-list')
        .should('contain.text', 'Children')
        .children('ul')
        .children()
        .should('have.length', 34);

      // Go back to the component diagram
      cy.get('.tabs .tab-btn').first().click();
      cy.get(`.node[data-id="HTTP server requests->GET /admin/orders"]`).should(
        'have.class',
        'highlight'
      );

      // Go back to Trace view and select event with exceptions
      cy.get('.tabs .tab-btn').last().click();
      cy.get('.trace-node[data-event-id="11"]').next().click();
      cy.get('.trace-node[data-event-id="18"]').click();

      cy.get('.event-params')
        .should('contain.text', 'Exceptions')
        .invoke('text')
        .should('match', /JSON::ParserError/)
        .should('match', /767:\s+unexpected\s+token\s+at/);
    });

    it('show child route events count', () => {
      cy.get('.details-search').should('be.visible');

      cy.get('.details-search__block-item')
        .contains('GET /admin/orders')
        .within(() => {
          cy.get('.details-search__block-item-count').should('contain.text', '2');
        });
    });
  });

  context('Java', () => {
    beforeEach(() => {
      cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension-java&viewMode=story');
    });

    it('does not show objects without any events', () => {
      cy.get('.node[data-id="org/springframework/web/filter/OncePerRequestFilter"]').should(
        'not.exist'
      );
    });
  });
});
