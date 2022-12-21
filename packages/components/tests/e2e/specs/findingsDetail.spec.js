context('Findings Detail', () => {
  describe('with No Data', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-finding-details--with-no-data&args=&viewMode=story'
      );
    });

    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('have.text', 'Oops, Something Went Wrong!');
    });
  });

  function testFindingDetailDisplay() {
    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('have.text', 'Deserialization of untrusted data');
    });

    it('displays the description', () => {
      const description =
        'Finds occurrances of deserialization in which the mechanism employed is known to be unsafe,' +
        " and the data comes from an untrusted source and hasn't passed through a sanitization mechanism.";

      cy.get('[data-cy="description"]').should('have.text', description);
    });

    it('displays a link to the docs', () => {
      const expectedDocsUrl =
        'https://appmap.io/docs/analysis/rules-reference.html#deserialization-of-untrusted-data';

      cy.get('[data-cy="docs-link"]')
        .should('contain.text', 'Learn More')
        .should('have.attr', 'href', expectedDocsUrl);
    });

    it('displays the event summary', () => {
      const eventSummary =
        'deserializes untrusted data: ---\noperation: reset\nsecret: !binary |-\n  ZNbZDWeSfI3K1bkh5REfAVLlp2dVErVNC3+qbLWExmGnla9BpxnT7qkIXR (...211 more characters)';
      cy.get('[data-cy="event-summary"]').should('contain.text', eventSummary);
    });

    it('displays the category', () => {
      cy.get('[data-cy="category"]').should('contain.text', 'Security');
    });

    it('displays the references', () => {
      const expectedReferenceNames = ['CWE-502', 'Ruby Security'];
      const expectedReferenceUrls = [
        'https://cwe.mitre.org/data/definitions/502.html',
        'https://docs.ruby-lang.org/en/3.0/doc/security_rdoc.html',
      ];

      cy.get('[data-cy="reference"]').each((el, index) => {
        cy.wrap(el)
          .should('contain.text', 'Reference')
          .should('contain.text', expectedReferenceNames[index])
          .find('a')
          .should('have.attr', 'href', expectedReferenceUrls[index]);
      });
    });

    it('displays the stack trace', () => {
      const expectedStackTraceDisplay = [
        '.../.rbenv/versions/3.0.2/lib/ruby/3.0.0/psych.rb:274',
        '.../land-of-apps/sample_app_6th_ed/app/models/user.rb',
        '.../lib/action_controller/metal/instrumentation.rb:19',
      ];

      const expectedHoverText = [
        '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/3.0.0/psych.rb',
        '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/app/models/user.rb',
        '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/gems/3.0.0/gems/actionpack-6.0.4.1/lib/action_controller/metal/instrumentation.rb',
      ];

      cy.get('[data-cy="stack-trace"]')
        .should('have.length', 3)
        .each((el, index) => {
          cy.wrap(el)
            .should('contain.text', expectedStackTraceDisplay[index])
            .trigger('mouseover')
            .find('[data-cy="popper"]')
            .should('be.visible')
            .should('contain.text', expectedHoverText[index]);
        });
    });
  }

  describe('with One Finding', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-finding-details--with-one-finding&args=&viewMode=story'
      );
    });

    testFindingDetailDisplay();

    it('displays the relevant AppMap', () => {
      cy.get('[data-cy="associated-maps-title"]').should('contain.text', 'Found in 1 AppMap');
      cy.get('[data-cy="associated-map"]')
        .should('have.length', 1)
        .should('contain.text', 'Password_resets_password_resets');
    });
  });

  describe('with Two Findings', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-finding-details--with-two-findings&args=&viewMode=story'
      );
    });

    testFindingDetailDisplay();

    it('displays the relevant AppMaps', () => {
      const expectedMaps = [
        'Password_resets_password_resets',
        'Password_resets_password_reset_attack',
      ];

      cy.get('[data-cy="associated-maps-title"]').should('contain.text', 'Found in 2 AppMaps');
      cy.get('[data-cy="associated-map"]')
        .should('have.length', 2)
        .each((el, index) => {
          cy.wrap(el).should('contain.text', expectedMaps[index]);
        });
    });
  });
});
