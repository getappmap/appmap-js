context('VS Code Extension (Filtering)', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
  });

  it('filters: root objects', () => {
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

  it('filters: when child of package was set as root - another children are filtered out', () => {
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
    cy.get('.details-search__block--package .details-search__block-item').should('have.length', 4);
    cy.get('.details-search__block--class .details-search__block-item').should('have.length', 11);

    cy.get('.tabs__controls .popper__button').click();
    cy.get('.filters__checkbox').eq(2).click();

    cy.get('.details-search__block--package .details-search__block-item').should('have.length', 2);
    cy.get('.details-search__block--class .details-search__block-item').should('have.length', 5);
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
    cy.get('.details-panel-filters .details-panel-filters__item').eq(1).click();

    cy.get('.nodes .node').should('have.length', 8);

    cy.get('.tabs__controls .popper__button').click();
    cy.get('.filters .filters__hide-item').should('have.length', 1);

    cy.get('.filters .filters__hide-item .filters__hide-item-icon').click();
    cy.get('.nodes .node').should('have.length', 9);
  });

  it('object selection is retained when changing filters', () => {
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
