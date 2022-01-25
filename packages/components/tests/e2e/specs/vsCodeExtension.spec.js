context('VS Code Extension', () => {
  context('Ruby appmap', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story'
      );
    });

    it('pans to the correct location when selecting "View in Trace"', () => {
      cy.get(
        '.node.class[data-id="active_support/ActiveSupport::SecurityUtils"]'
      ).click();

      cy.get('.v-details-panel-list')
        .contains('Outbound connections')
        .parent()
        .within(() => {
          cy.get('.list-item').contains('Digest::Instance#digest').click();
        });

      cy.get('.list-item:nth-child(16)').click();
      cy.get('button').contains('Show in Trace').click();
      cy.get('.trace-node.highlight').should('be.visible');
    });

    it('applies filter from search input', () => {
      cy.get('.details-search__input-element').type('json');

      cy.get(
        '.details-search__block--labels .details-search__block-item'
      ).should('have.length', 1);
      cy.get(
        '.details-search__block--package .details-search__block-item'
      ).should('have.length', 1);
      cy.get(
        '.details-search__block--class .details-search__block-item'
      ).should('have.length', 2);
      cy.get(
        '.details-search__block--function .details-search__block-item'
      ).should('have.length', 2);
    });

    it('filters out objects that do not originate from an HTTP server request', () => {
      cy.get('.details-search__block-list').contains('crypto').click();
      cy.get('.v-details-panel-list')
        .contains('Events')
        .parent()
        .should('not.contain.text', 'OpenSSL::Cipher#encrypt');
    });

    it('renders the component diagram initially', () => {
      cy.get('.appmap__component-diagram .output')
        .children('.nodes')
        .should('contain', 'app/controllers');
    });

    it('clicking info icon opens instructions', () => {
      cy.get('.instructions__icon').click();
      cy.get('.instructions__container').should('be.visible');

      cy.get('.instructions__close').click();
      cy.get('.instructions__container').should('not.be.visible');
    });

    it('clicking HTTP server requests displays the correct data', () => {
      cy.get('.details-search').should('be.visible');

      cy.get(`.node[data-type="http"]`)
        .click()
        .should('have.class', 'highlight');

      cy.get('.details-panel-header').should(
        'contain.text',
        'HTTP server requests'
      );

      cy.get('.v-details-panel-list')
        .should('contain.text', 'Routes')
        .children()
        .should(
          'contain.text',
          'GET /admin',
          'GET /admin/orders',
          'GET /admin/orders/:id/edit'
        );
    });

    it('clicking a package displays the correct data', () => {
      cy.get('.details-search').should('be.visible');

      cy.get('.node[data-id="app/controllers"]')
        .click()
        .should('have.class', 'highlight');

      cy.get('.details-panel-header').should('contain.text', 'app/controllers');

      cy.get('.v-details-panel-list')
        .should(
          'contain.text',
          'Classes',
          'Inbound connections',
          'Outbound connections'
        )
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

      cy.get(`.node[data-type="database"]`)
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

      // Verify the flow view renders as expected
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
          cy.get('.details-search__block-item-count').should(
            'contain.text',
            '2'
          );
        });
    });

    it('the current event is highlighted upon opening the flow view', () => {
      cy.get('.details-search').should('be.visible');

      cy.get(`.node[data-type="http"]`)
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

      cy.get('.trace-node[data-event-id="1"]').should(
        'have.class',
        'highlight'
      );
    });

    it('http server requests can navigate to route', () => {
      cy.get(`.node[data-type="http"]`)
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

    it('edge can navigate to event', () => {
      cy.get('.edgePath[data-from-type="http"][data-to="app/helpers"]')
        .should('have.css', 'opacity', '1')
        .click({ x: 3, y: 3 });

      cy.get('.v-details-panel-list')
        .contains('Events')
        .parent()
        .within(() => {
          cy.get('.list-pair__object')
            .contains('BaseHelper#admin_layout')
            .click();
        });

      cy.get('.details-panel-header')
        .should('contain.text', 'Event')
        .should('contain.text', 'Spree::Admin::BaseHelper#admin_layout');
    });

    it('event can navigate directly to flow view', () => {
      cy.get(`.node[data-type="database"]`).click();

      cy.get('.v-details-panel-list')
        .contains('Queries')
        .parent()
        .within(() => {
          cy.get('.list-item').first().click();
        });

      cy.get('.details-panel-header button').contains('Show in').click();

      cy.get('.trace').should('be.visible');
      cy.get('.trace .trace-node').should('have.length', 38);
      cy.get('.trace-node.highlight')
        .should('be.visible')
        .should('contain.text', 'SQL Select');
    });

    it('clears when "Clear selection" button was clicked', () => {
      cy.get(`.nodes .node[data-type="http"]`)
        .click()
        .should('have.class', 'highlight');

      cy.get('.details-panel__buttons').contains('Clear selection').click();

      cy.get(`.nodes .node[data-type="http"]`).should(
        'not.have.class',
        'highlight'
      );
    });

    it('expands package when child was selected from panel', () => {
      cy.get('.node[data-id="app/helpers"]').click();

      cy.get('.v-details-panel-list').within(() => {
        cy.get('.list-item').first().click();
      });

      cy.get('.cluster[data-id="app/helpers"]').should('have.length', 1);
    });

    it('set new root object', () => {
      cy.get(
        '.node[data-id="active_support/ActiveSupport::SecurityUtils"]'
      ).rightclick();

      cy.get('.dropdown-menu').contains('Set as root').click();

      cy.get(
        '.details-search__block--class .details-search__block-item'
      ).should('have.length', 2);
    });

    it('highlights only the first ancestor available if the selected object is not visible', () => {
      cy.get('.node[data-id="app/helpers"]').rightclick();

      cy.get('.dropdown-menu').contains('Expand').click();

      cy.get(
        '.node[data-id="app/helpers/Spree::Admin::NavigationHelper"]'
      ).click();

      cy.get('.v-details-panel-list')
        .contains('Functions')
        .parent()
        .within(() => {
          cy.get('.list-item').first().click();
        });

      cy.get('.edgePath.highlight').should('have.length', 1);
    });

    it('highlight is retained when expanding and collapsing a package', () => {
      cy.get('.node[data-id="app/helpers"]')
        .click()
        .should('have.class', 'highlight')
        .rightclick();

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

      cy.get('.dropdown-item:not([style*="display"])')
        .contains('Collapse')
        .click();

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

      cy.get('.dropdown-item:not([style*="display"])')
        .contains('Collapse')
        .click();

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

      cy.get('.node[data-id="lib/Spree::BackendConfiguration"]').should(
        'have.class',
        'highlight'
      );
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
      cy.get(
        `.node[data-id="active_support/ActiveSupport::SecurityUtils"]`
      ).click();

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
      cy.get(
        '.details-search__block--query > .details-search__block-list > :nth-child(1)'
      ).click();

      cy.get('.list-item:nth-child(1)').click();

      cy.get('.details-panel__buttons')
        .invoke('text')
        .should('not.match', /SELECT.*FROM/);
    });

    it('pans to the correct location when previewing events in the trace view', () => {
      cy.get(
        '.node.class[data-id="active_support/ActiveSupport::SecurityUtils"]'
      ).click();

      cy.get('.v-details-panel-list')
        .contains('Outbound connections')
        .parent()
        .within(() => {
          cy.get('.list-item').contains('Digest::Instance#digest').click();
        });

      cy.get('.list-item__event-quickview').each((el) => {
        cy.wrap(el).click();
        cy.get('.trace-node.focused').should('be.visible');
      });
    });

    it('pans to the correct location when using keyboard navigation', () => {
      cy.get('.tabs__header').contains('Trace').click();
      cy.get(':nth-child(2) > .trace-node > .trace-node__body')
        .click()
        .type('{rightarrow}');

      cy.get('body').trigger('keydown', { keycode: 38 }); // arrow up
      cy.get('.trace-node.highlight').should('be.visible');

      for (let i = 0; i < 50; ++i) {
        cy.get('body').trigger('keydown', { keycode: 40 }); // arrow down
        cy.get('.trace-node.highlight').should('be.visible');
      }
    });

    it('renders HTTP client requests correctly', () => {
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
          cy.get('li')
            .contains('Content-Type')
            .parent()
            .contains('application/json; charset=UTF-8');
          cy.get('li')
            .contains('User-Agent')
            .parent()
            .contains('selenium/3.142.7 (ruby macosx)');
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
          cy.get('li')
            .contains('Content-Type')
            .parent()
            .contains('application/json; charset=utf-8');
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

    it('highlight and loop through events selected from Trace view filter', () => {
      cy.get('.tabs .tab-btn').last().click();

      cy.get('.trace-view__search-input-suffix').should('not.exist');
      cy.get('.trace-view__search-input-element').type('example');
      cy.get('.trace-view__search-input-element').should(
        'have.value',
        'example'
      );
      cy.get('.trace-view__search-input-suffix').click();
      cy.get('.trace-view__search-input-element').should('have.value', '');

      let eventQuery = 'id:1 label:json id:3 id:15 id:99999 #link_to_edit_url';
      cy.get('.trace-view__search-input-element').type(eventQuery);

      cy.get('.trace-node[data-event-id="1"]')
        .should('be.visible')
        .should('have.class', 'highlight');

      cy.get('.trace-node[data-event-id="3"]').should('not.be.visible');

      cy.get('.trace-view__search-arrows-text').contains('1 / 32 results');

      cy.get('.trace-view__search-arrow').last().click();

      cy.get('.trace-node[data-event-id="3"]')
        .should('be.visible')
        .should('have.class', 'highlight');

      cy.get('.trace-view__search-arrow').last().click();

      cy.get('.trace-node[data-event-id="15"]')
        .should('be.visible')
        .should('have.class', 'highlight');

      cy.get('.trace-node[data-event-id="1"]').should('have.class', 'filtered');
      cy.get('.trace-node[data-event-id="3"]').should('have.class', 'filtered');

      cy.get('.trace-view__search-arrow').last().click();

      cy.get('.trace-node[data-event-id="18"]')
        .should('be.visible')
        .should('have.class', 'highlight');

      cy.get('.trace-view__search-arrow').first().click();

      cy.get('.trace-node[data-event-id="15"]')
        .should('be.visible')
        .should('have.class', 'highlight');

      cy.get('.trace-node[data-event-id="13"]')
        .click()
        .should('have.class', 'highlight');
      cy.get('.trace-node[data-event-id="1"]').should('have.class', 'filtered');
      cy.get('.trace-node[data-event-id="3"]').should('have.class', 'filtered');
      cy.get('.trace-node[data-event-id="15"]').should(
        'not.have.class',
        'highlight'
      );
      cy.get('.trace-view__search-arrows-text').should(
        'contain.text',
        '32 results'
      );

      cy.get('.details-panel__buttons').contains('Clear selection').click();

      cy.get('.trace-node[data-event-id="13"]').should(
        'not.have.class',
        'highlight'
      );
      cy.get('.trace-node[data-event-id="1"]').should(
        'not.have.class',
        'highlight'
      );
      cy.get('.trace-view__search-input-element').should(
        'have.value',
        eventQuery
      );
      cy.get('.trace-view__search-arrows-text').should('be.visible');
    });

    it('moves the active event filter selection as expected', () => {
      cy.get('.tabs .tab-btn').last().click();
      cy.get('.trace-view__search-input-element').type('label:json');
      cy.get('.trace-view__search-arrows-text').contains('1 / 27 results');
      cy.get('.trace-view__search-arrow').last().click();
      cy.get('.trace-view__search-arrows-text').contains('2 / 27 results');
      cy.get('.trace-view__search-arrow').first().click();
      cy.get('.trace-view__search-arrows-text').contains('1 / 27 results');
      cy.get('.trace-view__search-arrow').first().click();
      cy.get('.trace-view__search-arrows-text').contains('27 / 27 results');
      cy.get('.trace-node.highlight').should('have.length', 1);
      cy.get('.details-panel__buttons').contains('Clear selection').click();
      cy.get('.trace-view__search-arrows-text').contains('27 results');
      cy.get('.trace-node.highlight').should('not.exist');
      cy.get('.trace-node.filtered').should('have.length', 19);

      cy.get('.trace-view__search-arrow').first().click();
      cy.get('.trace-view__search-arrows-text').contains('27 / 27 results');
      cy.get('.details-panel__buttons').contains('Clear selection').click();

      cy.get('.trace-view__search-arrow').last().click();
      cy.get('.trace-view__search-arrows-text').contains('1 / 27 results');
      cy.get('.details-panel__buttons').contains('Clear selection').click();

      cy.get('.trace-node[data-event-id="28"]').click();
      cy.get('.trace-view__search-arrows-text').contains('27 results');
      cy.get('.trace-view__search-arrow').first().click();
      cy.get('.trace-view__search-arrows-text').contains('2 / 27 results');

      cy.get('.trace-node[data-event-id="38"]').click();
      cy.get('.trace-view__search-arrows-text').contains('27 results');
      cy.get('.trace-view__search-arrow').last().click();
      cy.get('.trace-view__search-arrows-text').contains('4 / 27 results');
    });

    it('filters: root objects', () => {
      cy.get(
        '.node[data-id="active_support/ActiveSupport::SecurityUtils"]'
      ).click();
      cy.get('.details-panel-filters .details-panel-filters__item')
        .first()
        .click();
      cy.get('.nodes .node').should('have.length', 2);

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters .filters__root').should('have.length', 1);

      cy.get('.filters .filters__root .filters__root-icon').click();
      cy.get('.nodes .node').should('have.length', 9);

      cy.get('.filters__form-input').first().focus();
      cy.get('.filters__form-suggestions').should('be.visible');
      cy.get('.filters__form-input').first().type('{esc}');
      cy.get('.filters__form-suggestions').should('not.be.visible');
      cy.get('.filters__form-input').first().type('{enter}');
      cy.get('.filters__form-suggestions').should('be.visible');
      cy.get('.nodes .node').should('have.length', 9);
      cy.get('.filters__form-suggestions-item').eq(1).click();
      cy.get('.nodes .node').should('have.length', 3);
      cy.get('.filters .filters__root .filters__root-icon').click();
      cy.get('.nodes .node').should('have.length', 9);

      cy.get('.tabs .tab-btn').last().click();
      cy.get('.trace .trace-node').should('have.length', 4);
      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(0).click();
      cy.get('.filters__form-input')
        .first()
        .type('route:HTTP server requests->GET /admin/orders')
        .parent()
        .submit();
      cy.get('.trace .trace-node').should('have.length', 2);
      cy.get('.filters .filters__root .filters__root-icon').click();

      cy.get('.tabs .tab-btn').first().click();
      cy.get('.nodes .node').should('have.length', 9);
      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__form-input')
        .first()
        .type('package:*/controllers')
        .parent()
        .submit();
      cy.get('.nodes .node').should('have.length', 3);
    });

    it('filters: navigate through filter suggestions with keyboard', () => {
      cy.get('.tabs__controls .popper__button').click();

      cy.get('.filters__form-input').first().focus();
      cy.get('.filters__form-suggestions').should('be.visible');
      cy.get('.filters__form-suggestions-item')
        .eq(0)
        .should('have.class', 'filters__form-suggestions-item--selected');

      cy.get('.filters__form-input').first().type('{downarrow}');
      cy.get('.filters__form-suggestions-item')
        .eq(1)
        .should('have.class', 'filters__form-suggestions-item--selected');

      cy.get('.filters__form-input').first().type('{uparrow}');
      cy.get('.filters__form-suggestions-item')
        .eq(0)
        .should('have.class', 'filters__form-suggestions-item--selected');

      cy.get('.filters__form-input').first().type('{esc}');
      cy.get('.filters__form-suggestions').should('not.be.visible');
    });

    it('filters: limit root events', () => {
      cy.get('.tabs .tab-btn').last().click();

      cy.get('.trace .trace-node').should('have.length', 4);

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(0).click();

      cy.get('.trace .trace-node').should('have.length', 12);
    });

    it('filters: hide media HTTP requests', () => {
      cy.get('.tabs .tab-btn').last().click();

      cy.get('.trace .trace-node').should('have.length', 4);

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(1).click();

      cy.get('.trace .trace-node').should('have.length', 5);
    });

    it('filters: hide unlabeled', () => {
      cy.get(
        '.details-search__block--package .details-search__block-item'
      ).should('have.length', 4);
      cy.get(
        '.details-search__block--class .details-search__block-item'
      ).should('have.length', 11);

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(2).click();

      cy.get(
        '.details-search__block--package .details-search__block-item'
      ).should('have.length', 2);
      cy.get(
        '.details-search__block--class .details-search__block-item'
      ).should('have.length', 5);
    });

    it('filters: hide elapsed time under 100ms', () => {
      cy.get('.tabs .tab-btn').last().click();

      cy.get('.trace .trace-node').should('have.length', 4);

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(3).click();

      cy.get('.trace .trace-node').should('have.length', 3);
    });

    it('filters: hide object', () => {
      cy.get('.nodes .node').should('have.length', 9);

      cy.get('.node[data-id="HTTP server requests"]').click();
      cy.get('.details-panel-filters .details-panel-filters__item')
        .eq(1)
        .click();

      cy.get('.nodes .node').should('have.length', 8);

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters .filters__hide-item').should('have.length', 1);

      cy.get('.filters .filters__hide-item .filters__hide-item-icon').click();
      cy.get('.nodes .node').should('have.length', 9);
    });
  });

  context('No HTTP appmap', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code--extension-without-http&viewMode=story'
      );
    });

    it('disable "Limit root events to HTTP" filter', () => {
      cy.get('.popper__button').click();
      cy.get('#limit-root-events').should('not.be.checked');
    });
  });

  context('Java appmap', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code--extension-java&viewMode=story'
      );
    });

    it('does not show objects without any events', () => {
      cy.get(
        '.node[data-id="org/springframework/web/filter/OncePerRequestFilter"]'
      ).should('not.exist');
    });

    it('HTTP events are properly named', () => {
      cy.get('.tabs .tab-btn').last().click();
      cy.get('.trace-node[data-event-id="1"]').should(
        'contain.text',
        'POST /owners/:ownerId/pets/:petId/visits/new'
      );
    });
  });

  context('Empty appmap', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-extension-empty--extension-empty&viewMode=story'
      );
    });

    it('shows empty appmap notice', () => {
      cy.get('.no-data-notice').should('exist');
    });
  });
});
