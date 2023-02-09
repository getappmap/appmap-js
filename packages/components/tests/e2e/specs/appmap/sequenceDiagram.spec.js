context('AppMap sequence diagram', () => {
  context('when it is the default view', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
      );
    });

    it('opens as the initial view', () => {
      cy.get('.sequence-diagram').children('.lane').should('have.length', 9);
    });
  });

  context('opening with component view', () => {
    beforeEach(() => {
      cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
    });

    it('highlights the proper action when selecting "View in Sequence"', () => {
      cy.get('.node.class[data-id="active_support/ActiveSupport::SecurityUtils"]').click();

      cy.get('.v-details-panel-list')
        .contains('Outbound connections')
        .parent()
        .within(() => {
          cy.get('.list-item').contains('Digest::Instance#digest').click();
        });

      cy.get('.list-item:nth-child(2)').click();
      cy.get('button').contains('Show in Sequence').click();
      cy.get('.call.selected > :first').should('be.visible');
    });
    it('pans to the correct location when selecting "View in Sequence"', () => {
      cy.get('.node.class[data-id="active_support/ActiveSupport::SecurityUtils"]').click();

      cy.get('.v-details-panel-list')
        .contains('Outbound connections')
        .parent()
        .within(() => {
          cy.get('.list-item').contains('Digest::Instance#digest').click();
        });

      cy.get('.list-item:nth-child(16)').click();
      cy.get('button').contains('Show in Sequence').click();
      cy.get('.call.selected > :first').should('be.visible');
      cy.get('.call.selected').should('have.attr', 'data-event-ids', '183 185');
    });
  });
});
