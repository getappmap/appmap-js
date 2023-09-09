context('Sequence Diagram', () => {
    beforeEach(() => {
  
      cy.visit(
          'http://localhost:6006/iframe.html?id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
        );
    });
  
    it('first lane lifeline box does not start before first action', () => {
        
      cy.contains('span', 'GET /admin')
        .then(($el1) => {
          const getAdminElement = $el1[0];
          const getAdminBottom = getAdminElement.getBoundingClientRect().bottom + Cypress.$(window).scrollTop();
            
          cy.get(".gutter").first().then(($el2) => {
            const firstGutterElement = $el2[0];
            const firstGutterTop = firstGutterElement.getBoundingClientRect().top + Cypress.$(window).scrollTop();
              
            // Problem was that the first gutter started way before the "GET /admin" call
            // Assert that this is not the case
            expect(getAdminBottom).to.be.at.most(firstGutterTop);
          }
        );
      });
    });
  });