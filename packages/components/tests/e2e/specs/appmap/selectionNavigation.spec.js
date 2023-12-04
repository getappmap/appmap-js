context('seleced objects navigation', () => {
  function clickForward() {
    cy.get('.details-panel__selection-nav-icon.arrow-right').click();
  }

  function clickBackward() {
    cy.get('.details-panel__selection-nav-icon.arrow-left').click();
  }

  context('with a small appmap', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=&id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
      );
    });

    const expectedFirstName = 'GET /admin/orders/:id/edit';
    const expectedSecondName = 'Spree::Admin::NavigationHelper#tab';
    const expectedThirdName = 'app/helpers';

    function selectCodeObjects() {
      cy.get('.details-search__block-item').eq(10).click();
      cy.get('li.list-item').last().click();
      cy.get('li.list-item').eq(-3).click();
    }

    function checkSelectedObject(expectedName) {
      cy.get('.selection-nav-menu').find('option:selected').should('contain.text', expectedName);
    }

    it('allows users to navigate backwards and forwards through selections', () => {
      selectCodeObjects();
      checkSelectedObject(expectedFirstName);
      clickBackward();
      checkSelectedObject(expectedSecondName);
      clickBackward();
      checkSelectedObject(expectedThirdName);
      clickForward();
      checkSelectedObject(expectedSecondName);
      clickForward();
      checkSelectedObject(expectedFirstName);
    });

    it('allows the user to navigate using the dropdown menu', () => {
      selectCodeObjects();
      cy.get('.selection-nav-menu').select(expectedFirstName);
      cy.get('.details-panel-header__details-name').should('contain.text', expectedFirstName);
      cy.get('.selection-nav-menu').select(expectedSecondName);
      cy.get('.details-panel-header__details-name').should('contain.text', 'tab');
      cy.get('.selection-nav-menu').select(expectedThirdName);
      cy.get('.details-panel-header__details-name').should('contain.text', expectedThirdName);
    });

    it('clears selections with the clearn button', () => {
      selectCodeObjects();
      cy.get('.selection-nav-menu option').should('have.length', 3);
      cy.get('.clear-selections-icon').click();
      cy.get('.selection-nav-menu option').should('not.exist');
    });

    it('clears selections when the map is refreshed', () => {
      selectCodeObjects();
      cy.get('.selection-nav-menu option').should('have.length', 3);
      cy.get('.control-button.diagram-reload').click();
      cy.get('.selection-nav-menu option').should('not.exist');
    });
  });

  context('with a map with findings', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=scenario:mapWithTwoFindings&id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
      );
    });

    it('keeps highlighting when returning to the finding', () => {
      cy.get('.details-search__block-item').first().click();
      cy.get('.highlighted').should('have.length', 31);
      cy.get('li.list-item').first().click();
      cy.get('.highlighted').should('have.length', 0);
      clickBackward();
      cy.get('.highlighted').should('have.length', 31);
      clickForward();
      cy.get('.highlighted').should('have.length', 0);
      cy.get('.selection-nav-menu').select(
        'N plus 1 SQL query: app_views_microposts__micropost_html_erb.render[326] contains 30 occurrences of SQL: SELECT "active_storage_attachments".* FROM "a...'
      );
      cy.get('.highlighted').should('have.length', 31);
    });

    it('can select multiple findings and navigate between them', () => {
      cy.get('.details-search__block-item').first().click();
      cy.get('li.list-item').first().click();
      cy.get('li.list-item').first().click();
      cy.get('.selection-nav-menu option').should('have.length', 3);
    });
  });
});
