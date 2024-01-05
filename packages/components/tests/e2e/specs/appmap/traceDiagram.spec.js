context('AppMap trace diagram', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
  });

  context('with HTTP events', () => {
    it('pans to the correct location when selecting "View in Trace"', () => {
      cy.get('.node.class[data-id="active_support/ActiveSupport::SecurityUtils"]').click();

      cy.get('.v-details-panel-list')
        .contains('Outbound connections')
        .parent()
        .within(() => {
          cy.get('.list-item').contains('Digest::Instance#digest').click();
        });

      cy.get('.list-item:nth-child(16)').click();
      cy.get('button').contains('Show in Trace').click();
      cy.get('.trace-node.highlight').should('be.visible');
    });

    it('opens with the current event highlighted', () => {
      cy.get('.details-search').should('be.visible');

      cy.get(`.node[data-type="http"]`)
        .click()
        .get('.list-item')
        .first()
        .click()
        .get('.list-item')
        .first()
        .click()
        .get('.tabs .tab-btn')
        .contains('Trace View')
        .click();

      cy.get('.details-panel-header')
        .should('contain.text', 'Event')
        .should('contain.text', 'GET /admin');

      cy.get('.trace-node[data-event-id="1"]').should('have.class', 'highlight');
    });

    it('pans to the correct location when previewing events', () => {
      cy.get('.node.class[data-id="active_support/ActiveSupport::SecurityUtils"]').click();

      cy.get('.v-details-panel-list')
        .contains('Outbound connections')
        .parent()
        .within(() => {
          cy.get('.list-item').contains('Digest::Instance#digest').click();
        });

      cy.get('.list-item__event-quickview').each((el) => {
        cy.wrap(el).click();
        cy.get('.trace-node.focused').should('be.visible');
      });
    });

    it('pans to the correct location when using keyboard navigation', () => {
      cy.get('.tabs__header').contains('Trace').click();
      cy.get(':nth-child(2) > .trace-node > .trace-node__body').click().type('{rightarrow}');

      cy.get('body').trigger('keydown', { keycode: 38 }); // arrow up
      cy.get('.trace-node.highlight').should('be.visible');

      for (let i = 0; i < 50; ++i) {
        cy.get('body').trigger('keydown', { keycode: 40 }); // arrow down
        cy.get('.trace-node.highlight').should('be.visible');
      }
    });
  });

  context('Java', () => {
    beforeEach(() => {
      cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension-java&viewMode=story');
    });

    it('HTTP events are properly named', () => {
      cy.get('.tabs .tab-btn').contains('Trace View').click();
      cy.get('.trace-node[data-event-id="1"]').should(
        'contain.text',
        'POST /owners/:ownerId/pets/:petId/visits/new'
      );
    });
  });
});
