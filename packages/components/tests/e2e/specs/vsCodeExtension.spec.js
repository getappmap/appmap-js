context('VS Code Extension', () => {
  context('Ruby appmap', () => {
    beforeEach(() => {
      cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
    });

    it('clicking the Share button opens a modal', () => {
      cy.get('.appmap-upload').click();
      cy.get('.share-appmap')
        .should('exist')
        .find('.url')
        .should('have.text', 'Retrieving link...');
      cy.get('.close-me').click();
      cy.get('.share-appmap').should('not.exist');
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
      cy.get('.filters__checkbox input[type="checkbox"]').first().should('not.be.checked');
    });
  });

  context('Java appmap', () => {
    beforeEach(() => {
      cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension-java&viewMode=story');
    });

    it('does not show objects without any events', () => {
      cy.get('.node[data-id="org/springframework/web/filter/OncePerRequestFilter"]').should(
        'not.exist'
      );
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
