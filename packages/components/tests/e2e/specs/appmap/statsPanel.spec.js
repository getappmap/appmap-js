context('AppMap stats panel', () => {
  context('without stats data', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=scenario:pet-clinic&id=pages-vs-code--extension&viewMode=story'
      );
    });

    it('does not render the stats panel button', () => {
      cy.get('[data-cy="stats-button"]').should('not.exist');
    });
  });

  context('with stats data', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=&id=pages-vs-code--extension&viewMode=story'
      );
    });

    it('is opened and closed by the stats panel button and the x icon', () => {
      cy.get('[data-cy="stats-button"]').click();
      cy.get('[data-cy="stats-panel"]').should('exist').should('be.visible');
      cy.get('[data-cy="stats-button"]').click();
      cy.get('[data-cy="stats-panel"]').should('not.exist');
      cy.get('[data-cy="stats-button"]').click();
      cy.get('[data-cy="stats-panel"]').should('exist').should('be.visible');
      cy.get('.close-me').click();
      cy.get('[data-cy="stats-panel"]').should('not.exist');
    });

    it('only has one of the share panel and stats panel open', () => {
      cy.get('[data-cy="stats-button"]').click();
      cy.get('[data-cy="stats-panel"]').should('exist').should('be.visible');
      cy.get('[data-cy="share-button"]').click();
      cy.get('.share-appmap').should('exist');
      cy.get('[data-cy="stats-panel"]').should('not.exist');
    });

    it('opens the filter modal on top of the stats panel', () => {
      cy.get('[data-cy="stats-button"]').click();
      cy.get('[data-cy="filter-button"]').click();
      cy.get('div.filters').should('exist').should('be.visible');
    });

    it('defaults to sorting by count and allows for sorting by any column', () => {
      // check that it is sorted by count
      cy.get('[data-cy="stats-button"]').click();
      cy.get('.stats-row')
        .eq(1)
        .find('li.fqid')
        .should('include.text', 'app/helpers/Spree::Admin::NavigationHelper#tab');
      cy.get('.stats-row')
        .eq(2)
        .find('li.fqid')
        .should('include.text', 'openssl/Digest::Instance#digest');

      // sort by count, ascending
      cy.get('[data-cy="count-header"]').click();
      cy.get('.stats-row')
        .eq(1)
        .find('li.fqid')
        .should('include.text', 'app/controllers/Spree::Admin::RootController#index');
      cy.get('.stats-row')
        .eq(2)
        .find('li.fqid')
        .should('include.text', 'app/controllers/Spree::Admin::OrdersController#edit');

      // sort by size, descending
      cy.get('[data-cy="size-header"]').click();
      cy.get('.stats-row')
        .eq(1)
        .find('li.fqid')
        .should('include.text', 'app/helpers/Spree::Admin::NavigationHelper#tab');
      cy.get('.stats-row')
        .eq(2)
        .find('li.fqid')
        .should('include.text', 'app/helpers/Spree::Admin::NavigationHelper#link_to_with_icon');

      // sort by size, ascending
      cy.get('[data-cy="size-header"]').click();
      cy.get('.stats-row')
        .eq(1)
        .find('li.fqid')
        .should('include.text', 'app/helpers/Spree::Admin::OrdersHelper#event_links');
      cy.get('.stats-row')
        .eq(2)
        .find('li.fqid')
        .should('include.text', 'app/controllers/Spree::Admin::RootController#index');

      // sort by function, descending
      cy.get('[data-cy="function-header"]').click();
      cy.get('.stats-row')
        .eq(1)
        .find('li.fqid')
        .should('include.text', 'openssl/OpenSSL::Cipher#final');
      cy.get('.stats-row')
        .eq(2)
        .find('li.fqid')
        .should('include.text', 'openssl/OpenSSL::Cipher#encrypt');

      // sort by function, ascending
      cy.get('[data-cy="function-header"]').click();
      cy.get('.stats-row')
        .eq(1)
        .find('li.fqid')
        .should('include.text', 'active_support/ActiveSupport::SecurityUtils.secure_compare');
      cy.get('.stats-row')
        .eq(2)
        .find('li.fqid')
        .should('include.text', 'app/controllers/Spree::Admin::OrdersController#edit');
    });

    it('opens the sequence diagram when the function name is clicked', () => {
      cy.viewport(1920, 1080);
      cy.get('[data-cy="stats-button"]').click();
      cy.get('.stats-row').eq(1).find('li.fqid > a').click();
      cy.get('.tab-btn--active').should('include.text', 'Sequence Diagram');
      cy.get('[data-cy="source-location"]').should(
        'include.text',
        'app/helpers/spree/admin/navigation_helper.rb:47'
      );
    });

    it('will not allow user to click on unavailable filtered functions', () => {
      cy.get('.tabs__header').contains('Sequence').click();
      cy.get('.sequence-actor[data-actor-id="package:openssl"] .hide-container').click();
      cy.get('[data-cy="stats-button"]').click();
      cy.get('.stats-row').eq(1).find('a').should('exist');
      cy.get('.stats-row').eq(2).find('a').should('not.exist');
      cy.get('.stats-row').eq(3).find('a').should('exist');
      cy.get('.stats-row').eq(7).find('a').should('not.exist');
    });
  });
});
