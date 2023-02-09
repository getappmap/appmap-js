context('AppMap view filter', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
  });

  context('with HTTP events', () => {
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
      cy.get('.filters__form-input').first().type('package:*/controllers').parent().submit();
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
      cy.get('.tabs .tab-btn').last().click();

      cy.get('.trace .trace-node').should('have.length', 4);

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(0).click();

      cy.get('.trace .trace-node').should('have.length', 12);
    });

    it('hides media HTTP requests', () => {
      cy.get('.tabs .tab-btn').last().click();

      cy.get('.trace .trace-node').should('have.length', 4);

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(1).click();

      cy.get('.trace .trace-node').should('have.length', 5);
    });

    it('hides unlabeled code', () => {
      cy.get('.details-search__block--package .details-search__block-item').should(
        'have.length',
        4
      );
      cy.get('.details-search__block--class .details-search__block-item').should('have.length', 11);

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(2).click();

      cy.get('.details-search__block--package .details-search__block-item').should(
        'have.length',
        2
      );
      cy.get('.details-search__block--class .details-search__block-item').should('have.length', 5);
    });

    it('hides by elapsed time', () => {
      cy.get('.tabs .tab-btn').last().click();

      cy.get('.trace .trace-node').should('have.length', 4);

      cy.get('.tabs__controls .popper__button').click();
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
      cy.get('.tabs .tab-btn').last().click();
      cy.get('.trace-node[data-event-id="1"]').click();

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(0).click();

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.trace-node[data-event-id="1"].highlight').should('exist');

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters__checkbox').eq(0).click();

      cy.get('.trace-node[data-event-id="1"].highlight').should('exist');
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
});
