context('AppMap event search', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
    cy.disableSmoothScrolling();
  });

  it('cycles through matches', () => {
    cy.get('.tabs .tab-btn').contains('Trace View').click();
    cy.get('.search-bar__input').type('label:json').type('{enter}');
    cy.get('.search-bar__arrows-text').contains('1 / 27 results');
    cy.get('.search-bar__arrow').last().click();
    cy.get('.search-bar__arrows-text').contains('2 / 27 results');
    cy.get('.search-bar__arrow').first().click();
    cy.get('.search-bar__arrows-text').contains('1 / 27 results');
    cy.get('.search-bar__arrow').first().click();
    cy.get('.search-bar__arrows-text').contains('27 / 27 results');
    cy.get('.trace-node.highlight').should('have.length', 1);
    cy.get('.search-bar__suffix svg').click();
    cy.get('.search-bar__arrows-text').should('not.exist');
    cy.get('.trace-node.highlight').should('not.exist');
    cy.get('.trace-node.filtered').should('have.length', 0);

    // selecting a node does not highlight it and has no effect on the search bar
    cy.get('.trace-node[data-event-id="430"]').click();
    cy.get('.search-bar__arrows-text').should('not.exist');
    cy.get('.trace-node.highlight:not(.selected)').should('not.exist');
    cy.get('.trace-node.filtered').should('have.length', 0);
  });

  it('only activates after typing a minimum number of characters', () => {
    cy.get('.tabs .tab-btn').contains('Trace View').click();

    cy.get('.search-bar__input').type('o');
    cy.get('.trace-node.filtered').should('not.exist');

    cy.get('.search-bar__input').type('r');
    cy.get('.trace-node.filtered').should('not.exist');

    cy.get('.search-bar__input').type('d');
    cy.get('.trace-node.filtered').should('not.exist');

    cy.get('.search-bar__input').type('{enter}');
    cy.get('.trace-node.filtered').should('exist');
  });

  it('displays suggestions', () => {
    cy.get('.tabs .tab-btn').contains('Trace View').click();

    cy.get('.search-bar__input').focus();
    cy.get('.search-bar__suggestions').should('be.visible');

    cy.get('.search-bar__suggestions-item').contains('GET /admin/orders').click();
    cy.get('.search-bar__input').should('have.value', '"GET /admin/orders" ');
    cy.get('.search-bar__arrows-text').contains('1 / 2 results');

    cy.get('.search-bar__input').type('{downarrow}').type('{enter}');
    cy.get('.search-bar__input').should('have.value', '"GET /admin/orders" "GET /admin" ');
    cy.get('.search-bar__suggestions').should('not.be.visible');
    cy.get('.search-bar__arrows-text').contains('1 / 3 results');

    cy.get('.search-bar__input').type('{esc}');
    cy.get('.search-bar__suggestions').should('not.be.visible');
    cy.get('.search-bar__input').should('not.be.focused');

    cy.get('.search-bar__suffix').click();
    cy.get('.search-bar__input').type('select');
    cy.get('.search-bar__suggestions').should('be.visible');
    cy.get('.search-bar__suggestions-item').should('have.length', 34);
    cy.get('.search-bar__suggestions-item').first().should('contain.text', 'SELECT');
    cy.get('.search-bar__input').type('{enter}');
    cy.get('.search-bar__arrows-text').contains('1 / 41 results');

    cy.get('.search-bar__suffix').click();
    cy.get('.search-bar__input').type('SELECT');
    cy.get('.search-bar__suggestions').should('be.visible');
    cy.get('.search-bar__suggestions-item').should('have.length', 34);
    cy.get('.search-bar__suggestions-item').first().should('contain.text', 'SELECT');
    cy.get('.search-bar__input').type('{enter}');
    cy.get('.search-bar__arrows-text').contains('1 / 41 results');

    cy.get('.search-bar__suffix').click();
    cy.get('.search-bar__input').type('"GET /admin');
    cy.get('.search-bar__suggestions').should('be.visible');
    cy.get('.search-bar__suggestions-item').should('have.length', 3);
  });
});
