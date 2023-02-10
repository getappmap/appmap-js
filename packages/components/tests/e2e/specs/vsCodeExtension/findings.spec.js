context('VS Code Extension (Component diagram)', () => {
  context('Appmap with one associated finding', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=scenario:mapWithFindings&id=pages-vs-code--extension&viewMode=story'
      );
    });

    it('shows one finding in details panel', () => {
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
      cy.get('.v-details-panel-list').find('li.list-item').should('have.length', 3).first().click();
      cy.get('.details-panel-header__details-type').should('contain.text', '681');

      // click to return to finding details panel
      cy.get('.v-details-panel-list.findings').should('exist').click();
      cy.get('.details-panel-header__details-name').should(
        'have.text',
        'Deserialization of untrusted data'
      );
    });

    it('shows related event in trace view', () => {
      // click to show finding details panel
      cy.get('.details-search__block--analysis-finding >> li').click();

      // check number of related events, then click to show a related event
      cy.get('.v-details-panel-list').find('li.list-item').should('have.length', 3).first().click();
      cy.get('.details-panel-header__details-type').should('contain.text', '681');

      cy.get('.details-panel-header__ghost-link').find('.details-btn').click();
      cy.get('.trace-node.highlight').should('exist');
    });
  });

  context('Appmap with two associated findings', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=scenario:mapWithTwoFindings&id=pages-vs-code--extension&viewMode=story'
      );
    });

    it('shows two findings in the details panel when opened', () => {
      cy.get('.details-search__block--analysis-finding')
        .should('exist')
        .find('.details-search__block-item')
        .should('have.length', 2);
    });

    it('correctly renders the details panel of an event with multiple findings', () => {
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
  });
});
