context('VS Code Extension (Sidebar)', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
  });

  it('displays source locations as expected', () => {
    cy.get('.details-panel__source').should('exist');
    cy.get('.details-panel__source .source-code-link__path').contains(
      'spec/system/application_spec.rb'
    );

    cy.get('.node[data-id="active_support/ActiveSupport::SecurityUtils"]').click();
    cy.get('[data-cy="left-panel-header"] [data-cy="source-location"]').contains(
      '/home/travis/.rvm/gems/ruby-2.6.5/gems/activesupport-6.0.3.4/lib/active_support/security_utils.rb'
    );

    cy.get('.node[data-id="lib/Spree::BackendConfiguration"]').click('');
    cy.get('[data-cy="left-panel-header"] [data-cy="source-location"]').contains(
      'lib/spree/backend_configuration.rb'
    );

    cy.get('.node[data-id="app/controllers"]').click();
    cy.get('[data-cy="left-panel-header"] [data-cy="source-location"]').should('not.exist');
  });

  it('provides an external link to source when available', () => {
    cy.get('.node[data-id="lib/Spree::BackendConfiguration"]').click('');
    cy.get(
      '[data-cy="left-panel-header"] [data-cy="source-location"] [data-cy="external-link"]'
    ).should('exist');

    cy.get('.node[data-id="app/controllers"]').click('');
    cy.get(
      '[data-cy="left-panel-header"] [data-cy="source-location"] [data-cy="external-link"]'
    ).should('not.exist');
  });

  it('displays a warning below source code links when applicable', () => {
    cy.get('.node[data-id="active_support/ActiveSupport::SecurityUtils"]').click();
    cy.get('[data-cy="left-panel-header"] [data-cy="source-location-error"]').contains(
      'External source not available'
    );

    cy.get('.node[data-id="app/controllers"]').click();
    cy.get('[data-cy="left-panel-header"] [data-cy="source-location-error"]').should('not.exist');

    cy.get('.node[data-id="lib/Spree::BackendConfiguration"]').click();
    cy.get('[data-cy="left-panel-header"] [data-cy="source-location-error"]').should('not.exist');
  });

  it('applies filter from search input', () => {
    cy.get('.details-search__input-element').type('json');

    cy.get('.details-search__block--labels .details-search__block-item').should('have.length', 1);
    cy.get('.details-search__block--package .details-search__block-item').should('have.length', 1);
    cy.get('.details-search__block--class .details-search__block-item').should('have.length', 2);
    cy.get('.details-search__block--function .details-search__block-item').should('have.length', 2);
  });

  it('filters out objects that do not originate from an HTTP server request', () => {
    cy.get('.details-search__block-list').contains('crypto').click();
    cy.get('.v-details-panel-list')
      .contains('Events')
      .parent()
      .should('not.contain.text', 'OpenSSL::Cipher#encrypt');
  });

  it('show child route events count', () => {
    cy.get('.details-search').should('be.visible');

    cy.get('.details-search__block-item')
      .contains('GET /admin/orders')
      .within(() => {
        cy.get('.details-search__block-item-count').should('contain.text', '2');
      });
  });

  it('does not back link to a large query when clicking a query from the search panel', () => {
    cy.get('.details-search__block--query > .details-search__block-list > :nth-child(1)').click();

    cy.get('.list-item:nth-child(1)').click();

    cy.get('.details-panel__buttons')
      .invoke('text')
      .should('not.match', /SELECT.*FROM/);
  });
});
