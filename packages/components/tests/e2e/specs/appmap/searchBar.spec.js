context('AppMap search bar', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?args=&id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
    );
    cy.disableSmoothScrolling();
  });

  it('selects the first result when pressing enter', () => {
    cy.get('.search-bar__input').type('secure').type('{enter}');
    cy.get('.search-bar__arrows-text').contains('1 / 12 results');
  });

  it('does not select the first result when clicking outside of the input', () => {
    cy.get('.search-bar__input').type('secure');

    // click outside of the input
    cy.get('.details-panel__title').click();
    cy.get('.search-bar__arrows-text').contains('12 results');
    cy.get('.search-bar__suggestions-item').should('not.be.visible');
  });

  it('does not select the first result when hitting the escape key', () => {
    cy.get('.search-bar__input').type('secure').type('{esc}');
    cy.get('.search-bar__arrows-text').contains('12 results');
    cy.get('.search-bar__suggestions-item').should('not.be.visible');
  });

  it('does not open the sidebar when interacting with the search bar', () => {
    cy.get('.details-panel__hide-panel-icon').click();
    cy.get('.search-bar__input').type('secure');
    cy.get('.details-panel').should('not.exist');
    cy.get('.search-bar__input').type('{enter}');
    cy.get('.details-panel').should('not.exist');
    cy.get('.search-bar__arrow-next').click();
    cy.get('.details-panel').should('not.exist');
  });

  it('does not throw an error when the up or down arrow is pressed and there are no suggestions', () => {
    cy.window().then((win) => cy.spy(win.console, 'error'));
    cy.get('.search-bar__input').type('abcdefghijkl').type('{downarrow}');
    cy.window().then((win) => expect(win.console.error).to.have.callCount(0));
  });

  context('in the dependency map', () => {
    beforeEach(() => {
      cy.get('.tabs .tab-btn').contains('Dependency Map').click();
    });

    it('loops through search results', () => {
      cy.get('.search-bar__input').type('Spree::Admin::RootController#index').type('{enter}');
      cy.get('.highlight')
        .should('be.visible')
        .should('contain.text', 'Spree::Admin::RootController');

      cy.get('.search-bar__input')
        .type('ActiveSupport::SecurityUtils.secure_compare')
        .type('{enter}');
      cy.get('.search-bar__arrow-next').click();
      cy.get('.highlight')
        .should('be.visible')
        .should('contain.text', 'ActiveSupport::SecurityUtils');
    });

    it('can show a selected and highlighted event at the same time', () => {
      cy.get('.details-search__block-item').first().click();
      cy.get('.highlight').should('be.visible').should('contain.text', 'GET /admin');

      cy.get('.search-bar__input')
        .type('Spree::Admin::NavigationHelper#admin_breadcrumb')
        .type('{enter}');
      cy.get('.highlight')
        .should('be.visible')
        .should('contain.text', 'Spree::Admin::NavigationHelper');
      cy.get('.details-panel-header__details-name')
        .should('be.visible')
        .should('contain.text', 'GET /admin');
    });
  });

  context('in the sequence diagram', () => {
    it('loops through search results', () => {
      cy.get('.search-bar__input').type('ActiveSupport::SecurityUtils.secure_compare');
      cy.get('.search-bar__suggestions-item').should('have.length', 1).click();
      cy.get('.highlighted > .call-line-segment')
        .should('be.visible')
        .should('contain.text', 'secure_compare');
      cy.get('[data-event-ids="12 20 28"] > .call-line-segment').should('be.visible');

      // advance through search results
      // the next result is in the same loop block
      cy.get('.search-bar__arrow-next').click();
      cy.get('.highlighted > .call-line-segment')
        .should('be.visible')
        .should('contain.text', 'secure_compare');
      cy.get('[data-event-ids="12 20 28"] > .call-line-segment').should('be.visible');

      // the next result is in the same loop block
      cy.get('.search-bar__arrow-next').click();

      // the next result is not in the same loop block as the first three results
      cy.get('.search-bar__arrow-next').click();
      cy.get('.highlighted > .call-line-segment')
        .should('be.visible')
        .should('contain.text', 'secure_compare');
      cy.get('[data-event-ids="42"] > .call-line-segment').should('be.visible');

      // check the next result
      cy.get('.search-bar__arrow-next').click();
      cy.get('.highlighted > .call-line-segment')
        .should('be.visible')
        .should('contain.text', 'secure_compare');
      cy.get('[data-event-ids="152 160 168"] > .call-line-segment').should('be.visible');
    });

    it('loops through search results with multiple code objects selected', () => {
      cy.get('.search-bar__input').type('GET');
      cy.get('.search-bar__suggestions-item').should('have.length', 3).first().click();
      cy.get('.highlighted > .call-line-segment')
        .should('be.visible')
        .should('contain.text', 'GET /admin');
      cy.get('[data-event-ids="1"] > .call-line-segment').should('be.visible');

      cy.get('.search-bar__input').type('/admin/orders/:id/edit');
      cy.get('.search-bar__suggestions-item').should('have.length', 1).click();
      cy.get('.search-bar__arrow-next').click();
      cy.get('.highlighted > .call-line-segment')
        .should('be.visible')
        .should('contain.text', 'GET /admin');
      cy.get('[data-event-ids="291"] > .call-line-segment').should('be.visible');
    });

    it('can show a selected and highlighted event at the same time', () => {
      // select an event
      cy.get('[data-event-ids="1"] > .call-line-segment').click();
      cy.get('.selected > .call-line-segment')
        .should('be.visible')
        .should('contain.text', 'GET /admin');

      // use the search bar
      cy.get('.search-bar__input')
        .type('ActiveSupport::SecurityUtils.secure_compare')
        .type('{enter}');
      cy.get('.highlighted > .call-line-segment')
        .should('be.visible')
        .should('contain.text', 'secure_compare');

      // advance through search results until the selected event is out of view
      cy.get('.search-bar__arrow-next').click();
      cy.get('.search-bar__arrow-next').click();
      cy.get('.search-bar__arrow-next').click();
      cy.get('.search-bar__arrow-next').click();
      cy.get('.selected > .call-line-segment').should('exist').should('not.be.visible');

      // select another event
      cy.get('.list-item').contains('Spree::Admin::RootController#index').click();
      cy.get('.highlighted > .call-line-segment').should('not.exist');
      cy.get('.selected > .call-line-segment').should('be.visible').should('contain.text', 'index');

      // advance through search results
      cy.get('.search-bar__arrow-next').click();
      cy.get('.highlighted > .call-line-segment')
        .should('be.visible')
        .should('contain.text', 'secure_compare');
      cy.get('.selected > .call-line-segment').should('exist').should('not.be.visible');

      // use selection navigation
      cy.get('.details-panel__selection-nav-icon.arrow-left').click();
      cy.get('.selected > .call-line-segment')
        .should('be.visible')
        .should('contain.text', 'GET /admin');
    });
  });

  context('in the trace view', () => {
    beforeEach(() => {
      cy.get('.tabs .tab-btn').contains('Trace View').click();
    });

    it('loops through search results', () => {
      cy.get('.search-bar__input').type('ActiveSupport::SecurityUtils.secure_compare');
      cy.get('.search-bar__suggestions-item').should('have.length', 1).click();
      cy.get('.highlight')
        .should('be.visible')
        .should('contain.text', 'ActiveSupport::SecurityUtils.secure_compare');
      cy.get('[data-event-id="12"]').should('be.visible');

      cy.get('.search-bar__arrow-next').click();
      cy.get('.highlight')
        .should('be.visible')
        .should('contain.text', 'ActiveSupport::SecurityUtils.secure_compare');
      cy.get('[data-event-id="20"]').should('be.visible');

      cy.get('.search-bar__arrow-next').click();
      cy.get('.highlight')
        .should('be.visible')
        .should('contain.text', 'ActiveSupport::SecurityUtils.secure_compare');
      cy.get('[data-event-id="28"]').should('be.visible');

      cy.get('.search-bar__arrow-next').click();
      cy.get('.highlight')
        .should('be.visible')
        .should('contain.text', 'ActiveSupport::SecurityUtils.secure_compare');
      cy.get('[data-event-id="42"]').should('be.visible');
    });

    it('can show a selected and highlighted event at the same time', () => {
      // select an event
      cy.get('[data-event-id="1"]').click();
      cy.get('.selected.highlight').should('be.visible').should('contain.text', 'GET /admin');

      // use the search bar
      cy.get('.search-bar__input')
        .type('ActiveSupport::SecurityUtils.secure_compare')
        .type('{enter}');
      cy.get('.highlight:not(.selected)')
        .should('be.visible')
        .should('contain.text', 'ActiveSupport::SecurityUtils.secure_compare');

      // advance through search results
      cy.get('.search-bar__arrow-next').click();
      cy.get('.selected.highlight')
        .should('exist')
        .should('not.be.visible')
        .should('contain.text', 'GET /admin');

      // select another event
      cy.get('.list-item').contains('Spree::Admin::RootController#index').click();
      cy.get('.selected.highlight')
        .should('be.visible')
        .should('contain.text', 'Spree::Admin::RootController#index');

      // advance through search results
      cy.get('.search-bar__arrow-next').click();
      cy.get('.highlight:not(.selected)')
        .should('be.visible')
        .should('contain.text', 'ActiveSupport::SecurityUtils.secure_compare');

      // clear the search bar
      cy.get('.search-bar__suffix').click();
      cy.get('.highlight:not(.selected)').should('not.exist');

      // use selection navigation
      cy.get('.details-panel__selection-nav-icon.arrow-left').click();
      cy.get('.selected.highlight').should('be.visible').should('contain.text', 'GET /admin');
    });
  });

  context('in the flame graph', () => {
    function checkHighlightedInFlameGraph(elapsedTime) {
      cy.get('.highlighted')
        .should('be.visible')
        .should('contain.text', `[${elapsedTime} ms] ActiveSupport::SecurityUtils.secure_compare`);
    }

    beforeEach(() => {
      cy.get('.tabs .tab-btn').contains('Flame Graph').click();
    });

    it('loops through search results', () => {
      cy.get('.search-bar__input').type('ActiveSupport::SecurityUtils.secure_compare');
      cy.get('.search-bar__suggestions-item').should('have.length', 1).click();

      // check for the correct elapsed time for each event
      const expectedElapsedTimes = [0.181, 0.162, 0.177, 0.163, 0.344, 0.16];
      expectedElapsedTimes.forEach((elapsedTime) => {
        checkHighlightedInFlameGraph(elapsedTime);
        cy.get('.search-bar__arrow-next').click();
      });
    });

    it('can show a selected and highlighted event at the same time', () => {
      // select an event
      cy.get('.flamegraph-item-route').contains('GET /admin/orders').first().click();
      cy.get('.flamegraph-item-crown')
        .should('be.visible')
        .should('contain.text', 'GET /admin/orders');

      // use the search bar
      cy.get('.search-bar__input')
        .type('ActiveSupport::SecurityUtils.secure_compare')
        .type('{enter}');
      cy.get('.flamegraph-item-crown.highlighted')
        .should('be.visible')
        .should('contain.text', 'ActiveSupport::SecurityUtils.secure_compare');

      // select another event
      cy.get('.list-item').contains('JSON::Ext::Parser#parse').first().click();
      cy.get('.flamegraph-item-crown.highlighted').should('not.exist');
      cy.get('.flamegraph-item-crown')
        .should('be.visible')
        .should('contain.text', 'JSON::Ext::Parser#parse');

      // advance through search results
      cy.get('.search-bar__arrow-next').click();
      cy.get('.flamegraph-item-crown.highlighted')
        .should('be.visible')
        .should('contain.text', 'ActiveSupport::SecurityUtils.secure_compare');

      // clear the search bar
      cy.get('.search-bar__suffix').click();
      cy.get('.flamegraph-item-crown.highlighted').should('not.exist');
      cy.get('.flamegraph-item-crown')
        .should('be.visible')
        .should('contain.text', 'JSON::Ext::Parser#parse');
    });
  });

  context('in a map with findings', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=scenario:mapWithTwoFindings&id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
      );
    });

    it('populates the search bar with relevant events', () => {
      cy.get('.details-search__block-item').first().click();
      cy.get('.search-bar__input').should(
        'have.value',
        'id:326 id:352 id:372 id:392 id:412 id:432 id:452 id:472 id:492 id:512 id:532 id:552 id:572 id:592 id:612 id:632 id:652 id:672 id:692 id:712 id:732 id:752 id:772 id:792 id:812 id:832 id:852 id:872 id:892 id:912 id:932 '
      );
      cy.get('.search-bar__arrows-text').contains('31 results');
    });
  });
});
