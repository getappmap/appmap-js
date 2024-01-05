context('AppMap view filter', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
  });

  context('with HTTP events', () => {
    it('filters root objects', () => {
      cy.get('.node[data-id="active_support/ActiveSupport::SecurityUtils"]').click();
      cy.get('.details-panel-filters .details-panel-filters__item').first().click();
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
      cy.get('.filters__form-suggestions-item').first().click();
      cy.get('.nodes .node').should('have.length', 3);
      cy.get('.filters .filters__root .filters__root-icon').click();
      cy.get('.nodes .node').should('have.length', 9);

      cy.get('.tabs .tab-btn').contains('Trace View').click();
      cy.get('.trace .trace-node').should('have.length', 4);
      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').first().click();
      cy.get('.filters__form-input').first().type('route:GET /admin/orders').parent().submit();
      cy.get('.trace .trace-node').should('have.length', 2);
      cy.get('.filters .filters__root .filters__root-icon').click();

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.tabs .tab-btn').first().click();
      cy.get('.nodes .node').should('have.length', 9);
      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__form-input').first().type('package:app/controllers').parent().submit();
      cy.get('.nodes .node').should('have.length', 3);
    });

    it('when child of package is set as root its children are filtered out', () => {
      cy.get('.nodes .node').should('have.length', 9);

      cy.get('.tabs__controls .popper__button').click();

      cy.get('.filters__form-input')
        .first()
        .type('class:json/JSON::Ext::Generator::State')
        .parent()
        .submit();

      cy.get('.nodes .node').should('have.length', 1);
      cy.get('.nodes .node')
        .first()
        .should('have.class', 'class')
        .should('have.attr', 'data-id', 'json/JSON::Ext::Generator::State');
    });

    it('keyboard navigates through filter suggestions', () => {
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

    it('limits root events', () => {
      cy.get('.tabs .tab-btn').contains('Trace View').click();

      cy.get('.trace .trace-node').should('have.length', 4);

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(0).click();

      cy.get('.trace .trace-node').should('have.length', 12);
    });

    it('hides media HTTP requests', () => {
      cy.get('.tabs .tab-btn').contains('Trace View').click();

      cy.get('.trace .trace-node').should('have.length', 4);

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(1).click();

      cy.get('.trace .trace-node').should('have.length', 5);
    });

    it('hides by elapsed time', () => {
      cy.get('.tabs .tab-btn').contains('Trace View').click();

      cy.get('.trace .trace-node').should('have.length', 4);

      cy.get('.tabs__controls .popper__button').click();

      cy.get('.filters__elapsed input').type('00');
      cy.get('.filters__checkbox').eq(3).click();

      cy.get('.trace .trace-node').should('have.length', 3);
    });

    it('hides code objects', () => {
      cy.get('.nodes .node').should('have.length', 9);

      cy.get('.node[data-id="HTTP server requests"]').click();
      cy.get('.details-panel-filters .details-panel-filters__item').eq(1).click();

      cy.get('.nodes .node').should('have.length', 8);

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters .filters__hide-item').should('have.length', 1);

      cy.get('.filters .filters__hide-item .filters__hide-item-icon').click();
      cy.get('.nodes .node').should('have.length', 9);
    });

    it('retains object selection when changing filters', () => {
      cy.get('.tabs .tab-btn').contains('Trace View').click();
      cy.get('.trace-node[data-event-id="1"]').click();

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(0).click();

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.trace-node[data-event-id="1"].highlight').should('exist');

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(0).click();

      cy.get('.trace-node[data-event-id="1"].highlight').should('exist');
    });

    it('filters external code', () => {
      cy.get('.tabs .tab-btn').eq(1).click();
      cy.get('.sequence-actor').should('have.length', 9);

      const expectedInitial = [
        'HTTP server requests',
        'app/controllers',
        'openssl',
        'active_support',
        'json',
        'app/helpers',
        'lib',
        '127.0.0.1:9515',
        'Database',
      ];

      cy.get('.sequence-actor').each(($el, index) => {
        cy.wrap($el).should('contain.text', expectedInitial[index]);
      });

      cy.get('.popper__button').click();
      cy.get('.filters__checkbox').eq(2).click();
      cy.get('.sequence-actor').should('have.length', 6);

      const expectedFiltered = [
        'HTTP server requests',
        'app/controllers',
        'app/helpers',
        'lib',
        '127.0.0.1:9515',
        'Database',
      ];

      cy.get('.sequence-actor').each(($el, index) => {
        cy.wrap($el).should('contain.text', expectedFiltered[index]);
      });
    });
  });

  context('with savedFilters', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=&id=pages-vs-code--extension-with-saved-filters&viewMode=story'
      );
    });

    it('disables the delete and default buttons for AppMap default filter', () => {
      cy.get('.tabs .tab-btn').contains('Trace View').click();
      cy.get('.trace .trace-node').should('have.length', 4);
      cy.get('.tabs__controls .popper__button').click();

      cy.get('.filters__select').find(':selected').should('contain.text', 'AppMap default');
      cy.get('.filters__button-disabled').first().should('contain.text', 'Load');
      cy.get('.filters__button').eq(1).should('contain.text', 'Copy');
      cy.get('.filters__button-disabled').eq(1).should('contain.text', 'Delete');
      cy.get('.filters__button-disabled').eq(2).should('contain.text', 'Set as default');
    });

    it('enables all buttons for a non-default filter', () => {
      cy.get('.tabs .tab-btn').contains('Trace View').click();
      cy.get('.trace .trace-node').should('have.length', 4);
      cy.get('.tabs__controls .popper__button').click();

      cy.get('.filters__select').select('filter');
      cy.get('.filters__select').find(':selected').should('contain.text', 'filter');
      cy.get('.filters__button').eq(1).should('contain.text', 'Load');
      cy.get('.filters__button').eq(2).should('contain.text', 'Delete');
      cy.get('.filters__button').eq(3).should('contain.text', 'Set as default');
      cy.get('.filters__button').eq(4).should('contain.text', 'Copy');
      cy.get('.filters__button-disabled').should('not.exist');
    });

    it('correctly applies a saved filter', () => {
      cy.get('.tabs .tab-btn').first().click();
      cy.get('.nodes .node').should('have.length', 9);

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__select').select('filter');
      cy.get('[data-cy="apply-filter-button"]').click();
      cy.get('.nodes .node').should('have.length', 5);

      cy.get('.filters__select').select('another test');
      cy.get('[data-cy="apply-filter-button"]').click();
      cy.get('.nodes .node').should('have.length', 6);
    });
  });

  context('when used in a browser', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=&id=pages-vs-code--extension&viewMode=story'
      );
    });

    it('disables the delete and default buttons for AppMap default filter', () => {
      cy.get('.tabs .tab-btn').contains('Trace View').click();
      cy.get('.trace .trace-node').should('have.length', 4);
      cy.get('.tabs__controls .popper__button').click();

      cy.get('.filters__select').find(':selected').should('contain.text', 'AppMap default');
      cy.get('.filters__button-disabled').first().should('contain.text', 'Load');
      cy.get('.filters__button').eq(1).should('contain.text', 'Copy');
      cy.get('.filters__button-disabled').eq(1).should('contain.text', 'Delete');
      cy.get('.filters__button-disabled').eq(2).should('contain.text', 'Set as default');
    });

    it('saves a new filter and sets it as default', () => {
      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__select > option').should('have.length', 1);

      // save new filter
      cy.get('.filters__checkbox').eq(2).click();
      cy.get('.filters__input').type('new filter');
      cy.get('[data-cy="save-filter-button"]').click();

      cy.get('.filters__select').find(':selected').should('contain.text', 'new filter');
      cy.get('.filters__button-disabled').first().should('contain.text', 'Load');
      cy.get('.filters__select > option').should('have.length', 2);

      // set as default
      cy.get('.filters__button').contains('Set as default').click();
      cy.get('.filters__button-disabled').eq(1).should('contain.text', 'Set as default');

      cy.get('.filters__select').select('AppMap default');
      cy.get('.filters__button').eq(2).should('contain.text', 'Set as default');
    });

    it('overwrites an existing filter with the same name', () => {
      cy.get('.tabs__controls .popper__button').click();

      // save new filter
      cy.get('.filters__checkbox').eq(2).click();
      cy.get('.filters__input').type('new filter');
      cy.get('[data-cy="save-filter-button"]').click();

      // overwrite new filter
      cy.get('.filters__checkbox').eq(3).click();
      cy.get('.filters__input').type('new filter');
      cy.get('[data-cy="save-filter-button"]').click();

      cy.get('.filters__select > option').should('have.length', 2);
    });
  });

  context('without HTTP events', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code--extension-without-http&viewMode=story'
      );
    });

    it('"Limit root events to HTTP" filter is disabled', () => {
      cy.get('.popper__button').click();
      cy.get('.filters__checkbox input[type="checkbox"]').first().should('not.be.checked');
    });
  });

  context('in a Java map', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=&id=pages-vs-code--extension-java&viewMode=story'
      );
    });

    it('does not show the hide external code checkbox', () => {
      cy.get('.popper__button').click();
      cy.get('.filters__block-row-content').should('have.length', 7);
      cy.get('.filters__block-row-content').each(($el) =>
        cy.wrap($el).should('not.contain.text', 'Hide external code')
      );
    });
  });
});
