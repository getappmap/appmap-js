context('AppMap sidebar', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
  });

  it('applies filter from search input', () => {
    cy.get('.details-search__input-element').type('json');

    cy.get('.details-search__block--labels .details-search__block-item').should('have.length', 1);
    cy.get('.details-search__block--package .details-search__block-item').should('have.length', 1);
    cy.get('.details-search__block--class .details-search__block-item').should('have.length', 2);
    cy.get('.details-search__block--function .details-search__block-item').should('have.length', 2);
  });

  it('component diagram edge can navigate to event', () => {
    cy.get('.edgePath[data-from-type="http"][data-to="app/helpers"]')
      .should('have.css', 'opacity', '1')
      .click({ x: 3, y: 3 });

    cy.get('.v-details-panel-list')
      .contains('Events')
      .parent()
      .within(() => {
        cy.get('.list-pair__object').contains('BaseHelper#admin_layout').click();
      });

    cy.get('.details-panel-header')
      .should('contain.text', 'Event')
      .should('contain.text', 'Spree::Admin::BaseHelper#admin_layout');
  });

  it('event can navigate directly to trace view', () => {
    cy.get(`.node[data-type="database"]`).click();

    cy.get('.v-details-panel-list')
      .contains('Queries')
      .parent()
      .within(() => {
        cy.get('.list-item').first().click();
      });

    cy.get('.details-panel-header button').contains('Show in Trace').click();

    cy.get('.trace').should('be.visible');
    cy.get('.trace .trace-node').should('have.length', 38);
    cy.get('.trace-node.highlight').should('be.visible').should('contain.text', 'SQL Select');
  });

  it('displays source locations as expected', () => {
    cy.get('.details-panel__source').should('exist');
    cy.get('.details-panel__source .source-code-link__path').contains(
      'spec/system/application_spec.rb'
    );

    cy.get('.node[data-id="active_support/ActiveSupport::SecurityUtils"]').click();
    cy.get('[data-cy="left-panel-header"] [data-cy="source-location"]').contains(
      '/home/travis/.rvm/gems/ruby-2.6.5/gems/activesupport-6.0.3.4/lib/active_support/security_utils.rb'
    );

    cy.get('.node[data-id="lib/Spree::BackendConfiguration"]').click('');
    cy.get('[data-cy="left-panel-header"] [data-cy="source-location"]').contains(
      'lib/spree/backend_configuration.rb'
    );

    cy.get('.node[data-id="app/controllers"]').click();
    cy.get('[data-cy="left-panel-header"] [data-cy="source-location"]').should('not.exist');
  });

  it('provides an external link to source when available', () => {
    cy.get('.node[data-id="lib/Spree::BackendConfiguration"]').click('');
    cy.get(
      '[data-cy="left-panel-header"] [data-cy="source-location"] [data-cy="external-link"]'
    ).should('exist');

    cy.get('.node[data-id="app/controllers"]').click('');
    cy.get(
      '[data-cy="left-panel-header"] [data-cy="source-location"] [data-cy="external-link"]'
    ).should('not.exist');
  });

  it('displays a warning below source code links when applicable', () => {
    cy.get('.node[data-id="active_support/ActiveSupport::SecurityUtils"]').click();
    cy.get('[data-cy="left-panel-header"] [data-cy="source-location-error"]').contains(
      'External source not available'
    );

    cy.get('.node[data-id="app/controllers"]').click();
    cy.get('[data-cy="left-panel-header"] [data-cy="source-location-error"]').should('not.exist');

    cy.get('.node[data-id="lib/Spree::BackendConfiguration"]').click();
    cy.get('[data-cy="left-panel-header"] [data-cy="source-location-error"]').should('not.exist');
  });

  it('filters out objects that do not originate from an HTTP server request', () => {
    cy.get('.details-search__block-list').contains('crypto').click();
    cy.get('.v-details-panel-list')
      .contains('Events')
      .parent()
      .should('not.contain.text', 'OpenSSL::Cipher#encrypt');
  });

  it('http server requests can navigate to route', () => {
    cy.get(`.node[data-type="http"]`).click().get('.list-item').first().click();

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
        cy.get('.list-item').contains('OrdersHelper').click();
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
        cy.get('.list-item').contains('menu_items').click();
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
        cy.get('.list-item').contains('menu_items').click();
      });

    cy.get('.details-panel-header')
      .should('contain.text', 'Function')
      .should('contain.text', 'menu_items');

    cy.get('.v-details-panel-list')
      .contains('Events')
      .parent()
      .within(() => {
        cy.get('.list-item').first().click();
      });

    cy.get('.details-panel-header')
      .should('contain.text', 'Event')
      .should('contain.text', 'Spree::BackendConfiguration#menu_items');
  });

  it('class can navigate to query', () => {
    cy.get(`.node[data-id="app/controllers"]`).click();

    cy.get('.v-details-panel-list')
      .contains('Classes')
      .parent()
      .within(() => {
        cy.get('.list-item').contains('OrdersController').click();
      });

    cy.get('.v-details-panel-list')
      .contains('Queries')
      .parent()
      .within(() => {
        cy.get('.list-item').first().click();
      });

    cy.get('.details-panel-header')
      .should('contain.text', 'Event')
      .should('contain.text', 'SQL Select');
  });

  it('responds to a new root object', () => {
    cy.get('.node[data-id="active_support/ActiveSupport::SecurityUtils"]').rightclick();

    cy.get('.dropdown-menu').contains('Set as root').click();

    cy.get('.details-search__block--class .details-search__block-item').should('have.length', 2);
  });

  it('highlights only the first ancestor available if the selected object is not visible', () => {
    cy.get('.node[data-id="app/helpers"]').rightclick();

    cy.get('.dropdown-menu').contains('Expand').click();

    cy.get('.node[data-id="app/helpers/Spree::Admin::NavigationHelper"]').click();

    cy.get('.v-details-panel-list')
      .contains('Functions')
      .parent()
      .within(() => {
        cy.get('.list-item').first().click();
      });

    cy.get('.edgePath.highlight').should('have.length', 1);
  });

  it('highlight is retained when expanding and collapsing a package', () => {
    cy.get('.node[data-id="app/helpers"]').click().should('have.class', 'highlight').rightclick();

    cy.get('.dropdown-menu').contains('Expand').click();

    cy.get('.node[data-id^="app/helpers"]').should('have.class', 'highlight');
    cy.get('.edgePath.highlight').should('have.length', 3);

    cy.get('.cluster[data-id="app/helpers"]')
      .click({
        position: 'bottomLeft',
      })
      .should('have.class', 'highlight')
      .rightclick({
        position: 'bottomLeft',
      });

    cy.get('.dropdown-item:not([style*="display"])').contains('Collapse').click();

    cy.get('.node[data-id="app/helpers"]').should('have.class', 'highlight');
  });

  it('highlight is retained collapsing a package and a child is selected', () => {
    cy.get('.node[data-id="app/helpers"]').rightclick();

    cy.get('.dropdown-menu').contains('Expand').click();

    cy.get('.node[data-id="app/helpers/Spree::Admin::OrdersHelper"]')
      .click()
      .should('have.class', 'highlight');

    cy.get('.cluster[data-id="app/helpers"]').rightclick({
      position: 'bottomLeft',
    });

    cy.get('.dropdown-item:not([style*="display"])').contains('Collapse').click();

    cy.get('.node[data-id="app/helpers"]').should('have.class', 'highlight');
  });

  it('highlight is restored from a function', () => {
    cy.get(`.node[data-id="lib/Spree::BackendConfiguration"]`).click();

    cy.get('.v-details-panel-list')
      .contains('Functions')
      .parent()
      .within(() => {
        cy.get('.list-item').contains('menu_items').click();
      });

    cy.get('.tabs .tab-btn').last().click();
    cy.get('.tabs .tab-btn').first().click();

    cy.get('.node[data-id="lib/Spree::BackendConfiguration"]').should('have.class', 'highlight');
  });

  it('shows label details', () => {
    cy.get('.node.package[data-id="openssl"]').click();

    cy.get('.v-details-panel-list')
      .contains('Classes')
      .parent()
      .within(() => {
        cy.get('.list-item').contains('Instance').click();
      });

    cy.get('.v-details-panel-list')
      .contains('Functions')
      .parent()
      .within(() => {
        cy.get('.list-item').contains('digest').click();
      });

    cy.get('.v-details-panel-labels').within(() => {
      cy.get('.labels__item').contains('security').click();
    });

    cy.get('.v-details-panel-list')
      .contains('Functions')
      .parent()
      .within(() => {
        cy.get('.list-item').should('have.length', 4);
      });
  });

  it('list of node parents is shown', () => {
    cy.get(`.node[data-id="active_support/ActiveSupport::SecurityUtils"]`).click();

    cy.get('.details-panel-header__parent').should('have.length', 1);

    cy.get('.v-details-panel-list')
      .contains('Functions')
      .parent()
      .within(() => {
        cy.get('.list-item').contains('secure_compare').click();
      });

    cy.get('.details-panel-header__parent').should('have.length', 2);

    cy.get('.v-details-panel-list')
      .contains('Events')
      .parent()
      .within(() => {
        cy.get('.list-item').first().click();
      });

    cy.get('.details-panel-header__parent').should('have.length', 3);
  });

  it('does not back link to a large query when clicking a query from the search panel', () => {
    cy.get('.details-search__block--query > .details-search__block-list > :nth-child(1)').click();

    cy.get('.list-item:nth-child(1)').click();

    cy.get('.details-panel__buttons')
      .invoke('text')
      .should('not.match', /SELECT.*FROM/);
  });

  // FIXME
  // This test is broken.
  xit('renders HTTP client requests correctly', () => {
    cy.get('.details-search__block--external-service')
      .contains('External services')
      .get('.details-search__block-item')
      .contains('127.0.0.1:9515')
      .click();

    cy.get('.node.external-service.highlight').should('exist');
    cy.get('.list-item').contains('POST http://127.0.0.1:9515');
    cy.get('button').contains('Clear selection').click();

    cy.get('.node.external-service')
      .should('not.have.class', 'highlight')
      .click()
      .should('have.class', 'highlight');

    cy.get('.list-item').contains('POST http://127.0.0.1:9515').click();

    cy.get('.event-params')
      .contains('Request headers')
      .parent()
      .within(() => {
        cy.get('li').contains('Accept').parent().contains('application/json');
        cy.get('li').contains('Content-Type').parent().contains('application/json; charset=UTF-8');
        cy.get('li').contains('User-Agent').parent().contains('selenium/3.142.7 (ruby macosx)');
        cy.get('li').contains('Content-Length').parent().contains('5067');
        cy.get('li')
          .contains('Accept-Encoding')
          .parent()
          .contains('gzip;q=1.0,deflate;q=0.6,identity;q=0.3');
      });

    cy.get('.event-params')
      .contains('HTTP response details')
      .parent()
      .within(() => {
        cy.get('li').contains('status').parent().contains('200');
      });

    cy.get('.event-params')
      .contains('Response headers')
      .parent()
      .within(() => {
        cy.get('li').contains('Content-Length').parent().contains('14');
        cy.get('li').contains('Content-Type').parent().contains('application/json; charset=utf-8');
        cy.get('li').contains('Cache-Control').parent().contains('no-cache');
      });

    cy.get('button').contains('Show in Trace').click();

    cy.get('.trace-node.highlight').within(() => {
      cy.get('.trace-node__header--http-client').contains(
        'External service call to 127.0.0.1:9515'
      );

      cy.get('.columns__column--left').within(() => {
        cy.get('.port-header').contains('HTTP');
        cy.get('.port-header').contains('Headers');

        cy.get('.label').contains('method');
        cy.get('.label').contains('url');
        cy.get('.label').contains('Accept');
        cy.get('.label').contains('Content-Type');
        cy.get('.label').contains('User-Agent');
        cy.get('.label').contains('Content-Length');
        cy.get('.label').contains('Accept-Encoding');
      });

      cy.get('.columns__column--right').within(() => {
        cy.get('.port-header').contains('Response');
        cy.get('.port-header').contains('Headers');

        cy.get('.label').contains('status');
        cy.get('.label').contains('Cache-Control');
        cy.get('.label').contains('Content-Type');
        cy.get('.label').contains('Content-Length');
      });
    });
  });
});
