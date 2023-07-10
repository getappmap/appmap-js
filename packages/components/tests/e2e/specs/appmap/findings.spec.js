context('AppMap findings', () => {
  context('with one associated finding', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=scenario:mapWithFindings&id=pages-vs-code--extension&viewMode=story'
      );
    });

    describe('sidebar', () => {
      it('shows one finding', () => {
        cy.get('.details-search__block--analysis-finding')
          .should('exist')
          .find('.details-search__block-item')
          .should('have.length', 1);
      });

      it('shows finding info when finding is clicked', () => {
        cy.get('.details-search__block--analysis-finding >> li').click();
        cy.get('.details-panel-header__details-name').should(
          'have.text',
          'Deserialization of untrusted data'
        );

        const expectedDescription =
          'Finds occurrances of deserialization in which the mechanism employed is known to be ' +
          "unsafe, and the data comes from an untrusted source and hasn't passed through a " +
          'sanitization mechanism.';

        cy.get('[data-cy="rule-description"]').should('have.text', expectedDescription);

        const expectedEventSummary =
          '\n    deserializes untrusted data: ---\noperation: ' +
          'reset\nsecret: !binary |-\n  kqbnrI7PtA7RwDTpldjVBhMm6w4Vf3FCre1iE+UKHbJTgUyoaVCnrpVygQ ' +
          '(...211 more characters)\n  ';

        cy.get('.details-panel-text').find('p').should('have.text', expectedEventSummary);
      });

      it('shows related events', () => {
        // click to show finding details panel
        cy.get('.details-search__block--analysis-finding >> li').click();

        // check number of related events, then click to show a related event
        cy.get('.v-details-panel-list')
          .find('li.list-item')
          .should('have.length', 3)
          .first()
          .click();
        cy.get('.details-panel-header__details-type').should('contain.text', '681');

        // click to return to finding details panel
        cy.get('.v-details-panel-list.findings').should('exist').click();
        cy.get('.details-panel-header__details-name').should(
          'have.text',
          'Deserialization of untrusted data'
        );
      });
    });

    describe('trace view', () => {
      it('shows related event', () => {
        // click to show finding details panel
        cy.get('.details-search__block--analysis-finding >> li').click();

        // check number of related events, then click to show a related event
        cy.get('.v-details-panel-list')
          .find('li.list-item')
          .should('have.length', 3)
          .first()
          .click();
        cy.get('.details-panel-header__details-type').should('contain.text', '681');

        cy.get('.details-panel-header__ghost-link')
          .find('.details-btn')
          .contains('Show in Trace')
          .click();
        cy.get('.trace-node.highlight').should('exist');
      });
    });

    describe('sequence diagram', () => {
      it('opens when clicking a security finding', () => {
        // click to show finding details panel
        cy.get('.details-search__block--analysis-finding >> li').click();

        cy.get('.tab-btn--active').contains('Sequence Diagram').should('exist');
        cy.get('.focused').should('contain.text', 'load');
      });
    });
  });

  context('with two associated findings', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=scenario:mapWithTwoFindings&id=pages-vs-code--extension&viewMode=story'
      );
    });

    describe('sidebar', () => {
      it('shows two findings when opened', () => {
        cy.get('.details-search__block--analysis-finding')
          .should('exist')
          .find('.details-search__block-item')
          .should('have.length', 2);
      });

      it('correctly renders an event with multiple findings', () => {
        cy.get('.details-search__block--analysis-finding')
          .find('.details-search__block-item')
          .first()
          .click();

        cy.get('.v-details-panel-list')
          .find('li.list-item')
          .should('have.length', 31)
          .first()
          .click();

        cy.get('.details-panel-header__details-type').should('contain.text', '326');

        cy.get('.v-details-panel-list.findings')
          .should('exist')
          .find('li.list-item')
          .should('have.length', 2);
      });

      it('highlights the related events of a performance finding in the flame graph', () => {
        cy.get('.details-search__block--analysis-finding')
          .find('.details-search__block-item')
          .first()
          .click();

        // the common ancestory should be focused
        cy.get('.flamegraph-item-crown').should(
          'contain.text',
          'app_views_microposts__micropost_html_erb.render'
        );

        // all related events should be highlighted
        cy.get('.highlighted').should('have.length', 31);
      });

      it('highlights the related events of a performance finding in the flame graph when accessed by going back in the selection stack', () => {
        cy.get('.details-search__block--analysis-finding')
          .find('.details-search__block-item')
          .first()
          .click();

        cy.get('li.list-item').contains('app_views_microposts__micropost_html_erb.render').click();

        // go back to last selection
        cy.get('.details-btn').contains('Back to').click();

        // the common ancestory should be focused
        cy.get('.flamegraph-item-crown').should(
          'contain.text',
          'app_views_microposts__micropost_html_erb.render'
        );

        // all related events should be highlighted
        cy.get('.highlighted').should('have.length', 31);
      });

      it('clears highlights when the finding is not selected', () => {
        cy.get('.details-search__block--analysis-finding')
          .find('.details-search__block-item')
          .first()
          .click();

        // all related events should be highlighted
        cy.get('.highlighted').should('have.length', 31);

        cy.get('.details-btn').contains('Clear selection').click();

        // now nothing should be highlighted
        cy.get('.highlighted').should('have.length', 0);
      });

      it('highlights the related events of a performance finding in the flame graph when accessed from an event and clears them when going back', () => {
        cy.get('.details-search__block-item')
          .contains('SELECT "users".* FROM "users" WHERE "users"."id" = ? LIMIT ?')
          .click();
        cy.get('li.list-item').eq(1).click();

        // click on the associated finding
        cy.get('li.list-item').contains('N plus 1 SQL query').click();

        // the common ancestory should be focused
        cy.get('.flamegraph-item-crown').should(
          'contain.text',
          'app_views_microposts__micropost_html_erb.render'
        );

        // all related events should be highlighted
        cy.get('.highlighted').should('have.length', 31);

        // go back to last selection
        cy.get('.details-btn').contains('Back to previous').click();
        cy.get('.highlighted').should('have.length', 0);
      });
    });
  });
});
