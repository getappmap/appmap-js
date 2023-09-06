context('Filter Menu', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=appland-diagrams-filter-menu--filter-menu&viewMode=story');
  });

  
  it('disables the Load button when selected filter matches current filter state', () => {
    
    cy.get('.filters__select').find(':selected').should('contain.text', 'AppMap default');
    // Check "Hide external code"
    cy.get('.filters__checkbox input[type="checkbox"]').eq(2).click({force: true})
    cy.get('.filters__button').eq(1).should('contain.text', 'Load');
    // Uncheck "Hide exteranl code" to match selected filter
    cy.get('.filters__checkbox input[type="checkbox"]').eq(2).click({force: true})
    cy.get('.filters__button-disabled').first().should('contain.text', 'Load');
  });

  
});
