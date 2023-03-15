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

    it('a button in the Actor box will hide a package', () => {
      cy.get('.sequence-actor[data-actor-id="package:openssl"] .hide-container').click();

      cy.get('.sequence-actor[data-actor-id="package:openssl"]').should('not.exist');

      cy.get('.tabs__controls .popper__button').click();
      cy.get('.filters .filters__hide-item').should('have.length', 1);
    });
  });

  context('with no data provided', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=appland-diagrams-sequence--empty&viewMode=story'
      );
    });

    it('shows a loading placeholder', () => {
      cy.get('.sequence-diagram-loading').should('exist');
    });
  });

  context('non-interactive mode', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=appland-diagrams-sequence--non-interactive&viewMode=story'
      );
    });

    it('Actor cannot be hidden', () => {
      cy.get('.sequence-actor[data-actor-id="package:openssl"] .hide-container').should(
        'not.exist'
      );
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
    // TODO: Passes locally, but fails in CI.
    // ➤ YN0000: [@appland/components]:      AssertionError: Timed out retrying after 4000ms: expected '<div.call-line-segment.single-span>' to be 'visible'
    // ➤ YN0000: [@appland/components]:
    // ➤ YN0000: [@appland/components]: This element `<div.call-line-segment.single-span>` is not visible because its content is being clipped by one of its parent elements, which has a CSS property of overflow: `hidden`, `scroll` or `auto`
    // ➤ YN0000: [@appland/components]:       at Context.eval (http://localhost:6006/__cypress/tests?p=tests/e2e/specs/appmap/sequenceDiagram.spec.js:128:41)
    xit('pans to the correct location when selecting "View in Sequence"', () => {
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
