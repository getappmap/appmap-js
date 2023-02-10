context('VS Code Extension (Trace view)', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
  });

  it('pans to the correct location when selecting "View in Trace"', () => {
    cy.get('.node.class[data-id="active_support/ActiveSupport::SecurityUtils"]').click();

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

    cy.get('.trace-node[data-event-id="1"]').should('have.class', 'highlight');
  });

  it('pans to the correct location when previewing events in the trace view', () => {
    cy.get('.node.class[data-id="active_support/ActiveSupport::SecurityUtils"]').click();

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
    cy.get(':nth-child(2) > .trace-node > .trace-node__body').click().type('{rightarrow}');

    cy.get('body').trigger('keydown', { keycode: 38 }); // arrow up
    cy.get('.trace-node.highlight').should('be.visible');

    for (let i = 0; i < 50; ++i) {
      cy.get('body').trigger('keydown', { keycode: 40 }); // arrow down
      cy.get('.trace-node.highlight').should('be.visible');
    }
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

  it('highlight and loop through events selected from Trace view filter', () => {
    cy.get('.tabs .tab-btn').last().click();

    cy.get('.trace-filter__suffix').should('not.exist');
    cy.get('.trace-filter__input').type('example');
    cy.get('.trace-filter__input').should('have.value', 'example');
    cy.get('.trace-filter__suffix').click();
    cy.get('.trace-filter__input').should('have.value', '');

    let eventQuery = 'id:1 label:json id:3 id:15 id:99999 #link_to_edit_url';
    cy.get('.trace-filter__input').type(eventQuery).type('{enter}');

    cy.get('.trace-node[data-event-id="1"]').should('be.visible').should('have.class', 'highlight');

    cy.get('.trace-node[data-event-id="3"]').should('not.exist');

    cy.get('.trace-filter__arrows-text').contains('1 / 32 results');

    cy.get('.trace-filter__arrow').last().click();

    cy.get('.trace-node[data-event-id="3"]').should('be.visible').should('have.class', 'highlight');

    cy.get('.trace-filter__arrow').last().click();

    cy.get('.trace-node[data-event-id="15"]')
      .should('be.visible')
      .should('have.class', 'highlight');

    cy.get('.trace-node[data-event-id="1"]').should('have.class', 'filtered');
    cy.get('.trace-node[data-event-id="3"]').should('have.class', 'filtered');

    cy.get('.trace-filter__arrow').last().click();

    cy.get('.trace-node[data-event-id="18"]')
      .should('be.visible')
      .should('have.class', 'highlight');

    cy.get('.trace-filter__arrow').first().click();

    cy.get('.trace-node[data-event-id="15"]')
      .should('be.visible')
      .should('have.class', 'highlight');

    cy.get('.trace-node[data-event-id="13"]').click().should('have.class', 'highlight');
    cy.get('.trace-node[data-event-id="1"]').should('have.class', 'filtered');
    cy.get('.trace-node[data-event-id="3"]').should('have.class', 'filtered');
    cy.get('.trace-node[data-event-id="15"]').should('not.have.class', 'highlight');
    cy.get('.trace-filter__arrows-text').should('contain.text', '32 results');

    cy.get('.details-panel__buttons').contains('Clear selection').click();

    cy.get('.trace-node[data-event-id="13"]').should('not.have.class', 'highlight');
    cy.get('.trace-node[data-event-id="1"]').should('not.have.class', 'highlight');
    cy.get('.trace-filter__input').should('have.value', eventQuery + ' ');
    cy.get('.trace-filter__arrows-text').should('be.visible');
  });

  it('disables "Limit root events to HTTP" filter when searching for root event which is hidden', () => {
    cy.get('.tabs .tab-btn').last().click();

    cy.get('.trace .trace-node').should('have.length', 4);

    cy.get('.tabs__controls .popper__button').click();
    cy.get('.filters__checkbox input[type="checkbox"]').first().should('be.checked');
    cy.get('.tabs__controls .popper__button').click();
    cy.get('.trace-node[data-event-id="7"]').should('not.exist');

    cy.get('.trace-filter__input').type('id:7').type('{enter}');

    cy.get('.trace .trace-node').should('have.length', 12);
    cy.get('.tabs__controls .popper__button').click();
    cy.get('.filters__checkbox input[type="checkbox"]').first().should('not.be.checked');
    cy.get('.tabs__controls .popper__button').click();
    cy.get('.trace-node[data-event-id="7"]').should('exist').should('have.class', 'highlight');
  });

  it('moves the active event filter selection as expected', () => {
    cy.get('.tabs .tab-btn').last().click();
    cy.get('.trace-filter__input').type('label:json').type('{enter}');
    cy.get('.trace-filter__arrows-text').contains('1 / 27 results');
    cy.get('.trace-filter__arrow').last().click();
    cy.get('.trace-filter__arrows-text').contains('2 / 27 results');
    cy.get('.trace-filter__arrow').first().click();
    cy.get('.trace-filter__arrows-text').contains('1 / 27 results');
    cy.get('.trace-filter__arrow').first().click();
    cy.get('.trace-filter__arrows-text').contains('27 / 27 results');
    cy.get('.trace-node.highlight').should('have.length', 1);
    cy.get('.details-panel__buttons').contains('Clear selection').click();
    cy.get('.trace-filter__arrows-text').contains('27 results');
    cy.get('.trace-node.highlight').should('not.exist');
    cy.get('.trace-node.filtered').should('have.length', 19);

    cy.get('.trace-filter__arrow').first().click();
    cy.get('.trace-filter__arrows-text').contains('27 / 27 results');
    cy.get('.details-panel__buttons').contains('Clear selection').click();

    cy.get('.trace-filter__arrow').last().click();
    cy.get('.trace-filter__arrows-text').contains('1 / 27 results');
    cy.get('.details-panel__buttons').contains('Clear selection').click();

    cy.get('.trace-node[data-event-id="28"]').click();
    cy.get('.trace-filter__arrows-text').contains('27 results');
    cy.get('.trace-filter__arrow').first().click();
    cy.get('.trace-filter__arrows-text').contains('2 / 27 results');

    cy.get('.trace-node[data-event-id="38"]').click();
    cy.get('.trace-filter__arrows-text').contains('27 results');
    cy.get('.trace-filter__arrow').last().click();
    cy.get('.trace-filter__arrows-text').contains('4 / 27 results');
  });

  it('only searches trace view after typing a certain number of characters', () => {
    cy.get('.tabs .tab-btn').last().click();

    cy.get('.trace-filter__input').type('o');
    cy.get('.trace-node.filtered').should('not.exist');

    cy.get('.trace-filter__input').type('r');
    cy.get('.trace-node.filtered').should('not.exist');

    cy.get('.trace-filter__input').type('d');
    cy.get('.trace-node.filtered').should('not.exist');

    cy.get('.trace-filter__input').type('{enter}');
    cy.get('.trace-node.filtered').should('exist');
  });

  it('displays Trace view filter suggestions', () => {
    cy.get('.tabs .tab-btn').last().click();

    cy.get('.trace-filter__input').focus();
    cy.get('.trace-filter__suggestions').should('be.visible');

    cy.get('.trace-filter__suggestions-item').contains('GET /admin/orders').click();
    cy.get('.trace-filter__input').should('have.value', '"GET /admin/orders" ');
    cy.get('.trace-filter__arrows-text').contains('1 / 2 results');

    cy.get('.trace-filter__input').type('{downarrow}').type('{enter}');
    cy.get('.trace-filter__input').should('have.value', '"GET /admin/orders" "GET /admin" ');
    cy.get('.trace-filter__suggestions').should('not.be.visible');
    cy.get('.trace-filter__arrows-text').contains('1 / 3 results');

    cy.get('.trace-filter__input').type('{esc}');
    cy.get('.trace-filter__suggestions').should('not.be.visible');
    cy.get('.trace-filter__input').should('not.be.focused');

    cy.get('.trace-filter__suffix').click();
    cy.get('.trace-filter__input').type('select');
    cy.get('.trace-filter__suggestions').should('be.visible');
    cy.get('.trace-filter__suggestions-item').should('have.length', 34);
    cy.get('.trace-filter__suggestions-item').first().should('contain.text', 'SELECT');
    cy.get('.trace-filter__input').type('{enter}');
    cy.get('.trace-filter__arrows-text').contains('1 / 41 results');

    cy.get('.trace-filter__suffix').click();
    cy.get('.trace-filter__input').type('SELECT');
    cy.get('.trace-filter__suggestions').should('be.visible');
    cy.get('.trace-filter__suggestions-item').should('have.length', 34);
    cy.get('.trace-filter__suggestions-item').first().should('contain.text', 'SELECT');
    cy.get('.trace-filter__input').type('{enter}');
    cy.get('.trace-filter__arrows-text').contains('1 / 41 results');

    cy.get('.trace-filter__suffix').click();
    cy.get('.trace-filter__input').type('"GET /admin');
    cy.get('.trace-filter__suggestions').should('be.visible');
    cy.get('.trace-filter__suggestions-item').should('have.length', 3);
  });
});
