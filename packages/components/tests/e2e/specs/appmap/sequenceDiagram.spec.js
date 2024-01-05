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

    it('expands packages to classes', () => {
      cy.get('.sequence-diagram').children('.lane').should('have.length', 9);
      cy.get('.sequence-actor[data-actor-id="package:openssl"] .expand-actor').click();

      const children = cy.get('.sequence-diagram').children('.lane');
      children.should('have.length', 10);
      const expected = [
        'HTTP server requests',
        'app/controllers',
        'Instance',
        'Cipher',
        'active_support',
        'json',
        'app/helpers',
        'lib',
        '127.0.0.1:9515',
        'Database',
      ];

      children.each(($el, index) => {
        cy.wrap($el).should('contain.text', expected[index]);
      });

      cy.get('.sequence-actor[data-actor-id="class:openssl/Digest::Instance"]').should('exist');
      cy.get('.sequence-actor[data-actor-id="class:openssl/OpenSSL::Cipher"]').should('exist');
    });

    it('should display the tooltip on hover on return label', () => {
      // Hover over the .label
      cy.get('.return:nth-child(14) .name').trigger('mouseover');
      cy.get('.return:nth-child(14) span.tooltip').should('exist');
      cy.get('.return:nth-child(14) .name').trigger('mouseout');
      cy.get('.return:nth-child(14) span.tooltip').should('not.be.visible');
    });

    it('should display the tooltip on hover on call label', () => {
      // Hover over the .label
      cy.get('.call:nth-child(17) .name').trigger('mouseover');
      cy.get('.call:nth-child(17) span.tooltip').should('exist');
      cy.get('.call:nth-child(17) .name').trigger('mouseout');
      cy.get('.call:nth-child(17) span.tooltip').should('not.exist');
    });

    it('should display the tooltip on hover on link_to_with_icon call label', () => {
      // Hover over the .label
      cy.get('.call:nth-child(72) .name').trigger('mouseover');
      cy.get('.call:nth-child(72) span.tooltip').should('exist');
      cy.get('.call:nth-child(72) .name').trigger('mouseout');
      cy.get('.call:nth-child(72) span.tooltip').should('not.exist');
    });

    it('should display the truncated tooltip on hover on generate call label', () => {
      cy.get('.call:nth-child(67) .name').trigger('mouseover');
      cy.get('.call:nth-child(67) span.tooltip')
        .should('exist')
        .invoke('text')
        .should((text) => {
          const trimmedText = text.trim().replace('arg: ', '');
          expect(trimmedText).to.match(/\.\.\.$/); // endsWith '...'
          expect(trimmedText).to.have.lengthOf(75);
        });
      cy.get('.call:nth-child(67) .name').trigger('mouseout');
      cy.get('.call:nth-child(67) span.tooltip').should('not.exist');
    });

    it('should display the truncated tooltip on hover on tab call label', () => {
      cy.get('.call:nth-child(293) .name').trigger('mouseover');
      cy.get('.call:nth-child(293) span.tooltip')
        .should('exist')
        .invoke('text')
        .should('include', '...,');
      cy.get('.call:nth-child(293) .name').trigger('mouseout');
      cy.get('.call:nth-child(293) span.tooltip').should('not.exist');
    });

    it('should not display the tooltip on hover on index call label without parameters', () => {
      cy.get('.call:nth-child(11) .name').trigger('mouseover');
      cy.get('.call:nth-child(11) span.tooltip').should('not.exist');
      cy.get('.call:nth-child(11) .name').trigger('mouseout');
      cy.get('.call:nth-child(11) span.tooltip').should('not.exist');
    });

    it('check if all .call-line-segment.connecting-span elements have position as relative', () => {
      // Check each .connecting-span for position: relative
      cy.get('.call-line-segment.connecting-span').each(($el) => {
        expect($el.css('position')).to.eq('relative');
      });
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
      cy.disableSmoothScrolling();
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

    it('highlights the proper action when selecting "View in Sequence" and does not collapse the selected event', () => {
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

      cy.get('.depth-button__decrease').click();
      cy.get('.call.selected > :first').should('be.visible');
    });
  });

  context('unused actors', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
      );
    });

    it('are hidden when not reachable visually', () => {
      cy.get('.sequence-diagram').children('.lane').should('have.length', 9);
      // First collapse button [-] belongs to "Get /admin" action.
      // Collapsing it should hide 1 actor (127.0.0.1:9515).
      cy.get('div.collapse-expand.expanded').first().click();
      cy.get('.sequence-diagram').children('.lane').should('have.length', 8);
    });
  });

  // Navigate to the first common ancestor after finding the span
  // representing call label labelText, to find the .collapse-expand
  // div containing [+].
  const getCollapseExpandElementOfActionLabel = (labelText, order = 0) =>
    cy
      .get('span')
      .filter(':contains("' + labelText + '")')
      .eq(order)
      .parent()
      .parent()
      .parent()
      .find('.collapse-expand');

  context('when an action is hidden', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
      );
    });

    it('becomes visible if panned with eyeball', () => {
      // Ensure it's collapsed
      let isCollapsed = false;
      getCollapseExpandElementOfActionLabel('GET /admin/orders').then(
        ($el) => (isCollapsed = $el.text() === '[+]')
      );
      if (!isCollapsed) getCollapseExpandElementOfActionLabel('GET /admin/orders').click();

      getCollapseExpandElementOfActionLabel('GET /admin/orders').should('have.class', 'collapsed');
      // Click related items
      cy.get('.details-search__block-item').contains('SELECT COUNT(*) FROM "spree_stores"').click();
      cy.get('span.list-item__event-quickview').first().click();

      // Parent should have expanded
      getCollapseExpandElementOfActionLabel('GET /admin/orders').should('have.class', 'expanded');
    });
  });

  context('compact look with collapse depth', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
      );
      cy.disableSmoothScrolling();
    });

    it('action is collapsed when inside current depth', () => {
      cy.get('div.depth-text').first().contains('3');

      getCollapseExpandElementOfActionLabel('index').should('have.class', 'expanded');

      cy.get('button[data-cy="decrease-collapse-depth"]').click({ force: true });
      cy.get('button[data-cy="decrease-collapse-depth"]').click({ force: true });
      cy.get('div.depth-text').first().contains('1');

      getCollapseExpandElementOfActionLabel('index').should('have.class', 'collapsed');
    });

    it('action is not collapsed if it has a selected descendant', () => {
      // select
      cy.get('span').contains('secure_compare').click();

      cy.get('div.depth-text').first().contains('3');
      for (let i = 0; i < 3; i++)
        cy.get('button[data-cy="decrease-collapse-depth"]').click({ force: true });
      cy.get('div.depth-text').first().contains('0');

      // parent action should not be collapsed even if the collapse depth is 0
      getCollapseExpandElementOfActionLabel('GET /admin/orders').should('have.class', 'expanded');
    });

    it('action is not collapsed when not inside current depth', () => {
      cy.get('div.depth-text').first().contains('3');
      getCollapseExpandElementOfActionLabel('secure_compare').should('have.class', 'expanded');
    });

    it('action is expanded again after current depth increases', () => {
      cy.get('div.depth-text').first().contains('3');
      getCollapseExpandElementOfActionLabel('index').should('have.class', 'expanded');

      cy.get('button[data-cy="decrease-collapse-depth"]').click({ force: true });
      cy.get('button[data-cy="decrease-collapse-depth"]').click({ force: true });
      cy.get('div.depth-text').first().contains('1');

      getCollapseExpandElementOfActionLabel('index').should('have.class', 'collapsed');

      cy.get('button[data-cy="increase-collapse-depth"]').click();
      cy.get('div.depth-text').first().contains('2');
      getCollapseExpandElementOfActionLabel('index').should('have.class', 'expanded');
    });

    it('action is expanded when showed in sequence', () => {
      cy.get('div.depth-text').first().contains('3');

      cy.get('button[data-cy="decrease-collapse-depth"]').click({ force: true });
      cy.get('button[data-cy="decrease-collapse-depth"]').click({ force: true });
      cy.get('button[data-cy="decrease-collapse-depth"]').click({ force: true });
      cy.get('div.depth-text').first().contains('0');

      cy.get('.tabs .tab-btn').contains('Dependency Map').click();

      cy.get('.database tspan').click();
      cy.get('h5.details-panel-list-header')
        .contains('Queries')
        .next('ul')
        .find('li')
        .first()
        .click();

      cy.get('button.details-btn').contains('Show in Sequence').click();
      cy.get('div.depth-text').first().contains('1');
      cy.get('div[data-event-ids="64"]').should('have.class', 'selected');
    });

    it('shows the selected event even if it is collapsed', () => {
      cy.get('button[data-cy="decrease-collapse-depth"]').click().click().click();
      cy.get('div.depth-text').first().contains('0');
      cy.get('.details-search__block-item').contains('OpenSSL::Cipher#final').click();
      cy.get('li.list-item').first().click();
      cy.get('div.selected').contains('final').should('be.visible');
    });
  });

  context('default collapse depth check', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?args=scenario:appland1&id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
      );
    });

    it('depth is within limits', () => {
      cy.get('div.depth-text').first().contains('1');

      cy.get('button[data-cy="decrease-collapse-depth"]').click({ force: true });
      cy.get('div.depth-text').first().contains('0');

      cy.get('button[data-cy="increase-collapse-depth"]').click({ force: true });
      cy.get('div.depth-text').first().contains('1');
    });
  });
});
