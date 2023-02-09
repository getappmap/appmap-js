context('AppMap event search', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
  });

  it('cycles through matches', () => {
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

  it('only activates after typing a minimum number of characters', () => {
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

  it('displays suggestions', () => {
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
