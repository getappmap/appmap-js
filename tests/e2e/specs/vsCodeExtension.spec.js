import { CodeObjectType } from '../../../src/lib/models/codeObject';

context('VS Code Extension', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=pages--vs-code-extension&viewMode=story',
    );
  });

  it('renders the component diagram initially', () => {
    cy.get('.appmap__component-diagram .output')
      .children('.nodes')
      .should('contain', 'app/controllers');
  });

  it('clicking HTTP server requests displays the correct data', () => {
    cy.get('#intro-details').should('be.visible');

    cy.get(`.node[data-type="${CodeObjectType.HTTP}"]`)
      .click()
      .should('have.class', 'highlight');

    cy.get('.details-panel-header').should(
      'contain.text',
      'HTTP server requests',
    );

    cy.get('.v-details-panel-list')
      .should('contain.text', 'Routes')
      .children()
      .should(
        'contain.text',
        'GET /admin',
        'GET /admin/orders',
        'GET /admin/orders/:id/edit',
      );
  });

  it('clicking a package displays the correct data', () => {
    cy.get('#intro-details').should('be.visible');

    cy.get('.node[data-id="app/controllers"]')
      .click()
      .should('have.class', 'highlight');

    cy.get('.details-panel-header').should('contain.text', 'app/controllers');

    cy.get('.v-details-panel-list')
      .should(
        'contain.text',
        'Classes',
        'Inbound connections',
        'Outbound connections',
      )
      .children()
      .should(
        'contain.text',
        'OrdersController',
        'RootController',
        'GET /admin',
        'GET /admin/orders',
        'GET /admin/orders/:id/edit',
        'SELECT',
      );
  });

  it('clicking a class displays the correct data', () => {
    cy.get('#intro-details').should('be.visible');

    cy.get('.node[data-id="active_support/ActiveSupport::SecurityUtils"]')
      .click()
      .should('have.class', 'highlight');

    cy.get('.details-panel-header').should(
      'contain.text',
      'Class',
      'SecurityUtils',
      'View source',
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
    cy.get('#intro-details').should('be.visible');

    cy.get(`.node[data-type="${CodeObjectType.DATABASE}"]`)
      .click()
      .should('have.class', 'highlight');

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
    cy.get('#intro-details').should('be.visible');

    cy.get('.edgePath[data-from="HTTP server requests"][data-to="app/helpers"]')
      .click()
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
    cy.get('#intro-details').should('be.visible');

    cy.get('.tabs .tab-btn').last().click();

    // Verify the flow view renders as expected
    cy.get('.diagram-flow').should('be.visible');
    cy.get('.appmap__flow-view .node').should('have.length', 248);

    cy.get('.node[data-event-id="9"]').click();
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
      'highlight',
    );
  });

  it('the current event is highlighted upon opening the flow view', () => {
    cy.get('#intro-details').should('be.visible');

    cy.get(`.node[data-type="${CodeObjectType.HTTP}"]`)
      .click()
      .get('.list-item')
      .first()
      .click()
      .get('.list-item')
      .first()
      .click()
      .get('.tabs .tab-btn')
      .last()
      .click();

    cy.get('.details-panel-header')
      .should('contain.text', 'Event')
      .should('contain.text', 'GET /admin');

    cy.get('.node[data-event-id="1"]').should('have.class', 'highlight');
  });

  it('http server requests can navigate to route', () => {
    cy.get(`.node[data-type="${CodeObjectType.HTTP}"]`)
      .click()
      .get('.list-item')
      .first()
      .click();

    cy.get('.details-panel-header')
      .should('contain.text', 'Route')
      .should('contain.text', 'GET /admin');
  });

  it('package can navigate to class', () => {
    cy.get(`.node[data-id="app/helpers"]`).click();

    cy.get('.v-details-panel-list')
      .contains('Classes')
      .parent()
      .within(() => {
        cy.get('a.list-item').contains('OrdersHelper').click();
      });

    cy.get('.details-panel-header')
      .should('contain.text', 'Class')
      .should('contain.text', 'OrdersHelper');
  });

  it('class can navigate to function', () => {
    cy.get(`.node[data-id="lib/Spree::BackendConfiguration"]`).click();

    cy.get('.v-details-panel-list')
      .contains('Functions')
      .parent()
      .within(() => {
        cy.get('a.list-item').contains('menu_items').click();
      });

    cy.get('.details-panel-header')
      .should('contain.text', 'Function')
      .should('contain.text', 'menu_items');
  });

  it('function can navigate to event', () => {
    cy.get(`.node[data-id="lib/Spree::BackendConfiguration"]`).click();

    cy.get('.v-details-panel-list')
      .contains('Functions')
      .parent()
      .within(() => {
        cy.get('a.list-item').contains('menu_items').click();
      });

    cy.get('.details-panel-header')
      .should('contain.text', 'Function')
      .should('contain.text', 'menu_items');

    cy.get('.v-details-panel-list')
      .contains('Events')
      .parent()
      .within(() => {
        cy.get('a.list-item').first().click();
      });

    cy.get('.details-panel-header')
      .should('contain.text', 'Event')
      .should('contain.text', 'Spree::BackendConfiguration#menu_items');
  });

  it('edge can navigate to event', () => {
    cy.get(
      `.edgePath[data-from="HTTP server requests"][data-to="app/helpers"]`,
    ).click();

    cy.get('.v-details-panel-list')
      .contains('Events')
      .parent()
      .within(() => {
        cy.get('a.list-item').contains('BaseHelper#admin_layout').click();
      });

    cy.get('.details-panel-header')
      .should('contain.text', 'Event')
      .should('contain.text', 'Spree::Admin::BaseHelper#admin_layout');
  });

  it('event can navigate directly to flow view', () => {
    cy.get(`.node[data-type="${CodeObjectType.DATABASE}"]`).click();

    cy.get('.v-details-panel-list')
      .contains('Queries')
      .parent()
      .within(() => {
        cy.get('a.list-item').first().click();
      });

    cy.get('.details-panel-header a').contains('Show in').click();

    cy.get('.diagram-flow').should('be.visible');
    cy.get('.appmap__flow-view .node').should('have.length', 248);
    cy.get('.node.highlight .header[data-type="sql"]').should('be.visible');
  });

  it('clears when "Clear selection" button was clicked', () => {
    cy.get(`.nodes .node[data-type="${CodeObjectType.HTTP}"]`)
      .click()
      .should('have.class', 'highlight');

    cy.get('.details-panel__buttons .clear-btn')
      .contains('Clear selection')
      .click();

    cy.get(`.nodes .node[data-type="${CodeObjectType.HTTP}"]`).should(
      'not.have.class',
      'highlight',
    );
  });

  it('expands/collapses package when child class was selected previously and package has been selected again', () => {
    cy.get('.node[data-id="app/helpers"]').click();

    cy.get('.v-details-panel-list').within(() => {
      cy.get('a.list-item').first().click();
    });

    cy.get('.cluster[data-id="app/helpers"]').should('have.length', 1);

    cy.get('.details-panel__buttons .back-btn').click();

    cy.get('.cluster[data-id="app/helpers"]').should('have.length', 0);
    cy.get('.node[data-id="app/helpers"]').should('have.length', 1);
  });

  it('highlights class when child function was selected', () => {
    cy.get('.node[data-id="app/helpers"]').rightclick();

    cy.get('.dropdown-menu').contains('Expand').click();

    cy.get(
      '.node[data-id="app/helpers/Spree::Admin::NavigationHelper"]',
    ).click();

    cy.get('.v-details-panel-list')
      .contains('Functions')
      .parent()
      .within(() => {
        cy.get('a.list-item').first().click();
      });

    cy.get('.edgePath.highlight').should('have.length', 1);
  });
});
