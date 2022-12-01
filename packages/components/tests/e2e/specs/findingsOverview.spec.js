context('Findings Overview', () => {
  const pageTitle = 'Runtime Analysis';

  describe('with No Findings', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-analysis-findings--with-no-findings&args=&viewMode=story'
      );
    });

    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('contain.text', pageTitle);
    });

    it('shows 0 findings', () => {
      cy.get('[data-cy="category-all"]').should('contain.text', 'All: 0');
      cy.get('[data-cy="finding-table"]').get('[data-cy="finding"]').should('have.length', 0);
    });

    it('does not show any category labels', () => {
      cy.get('[data-cy="category-security"]').should('not.exist');
      cy.get('[data-cy="category-performance"]').should('not.exist');
      cy.get('[data-cy="category-stability"]').should('not.exist');
      cy.get('[data-cy="category-maintainability"]').should('not.exist');
    });
  });

  describe('with Findings', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-analysis-findings--with-findings&args=&viewMode=story'
      );
    });

    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('contain.text', pageTitle);
    });

    it('shows the correct number of findings', () => {
      const numFindings = 3;

      cy.get('[data-cy="category-all"]').should('contain.text', `All: ${numFindings}`);
      cy.get('[data-cy="finding"]').should('have.length', numFindings);
    });

    it('shows the correct category labels', () => {
      const numSecurityFindings = 2;
      const numPerformanceFindings = 1;

      cy.get('[data-cy="category-security"]').should(
        'contain.text',
        `Security: ${numSecurityFindings}`
      );
      cy.get('[data-cy="category-performance"]').should(
        'contain.text',
        `Performance: ${numPerformanceFindings}`
      );
      cy.get('[data-cy="category-stability"]').should('not.exist');
      cy.get('[data-cy="category-maintainability"]').should('not.exist');
    });

    it('shows the problems tab button', () => {
      cy.get('[data-cy="problems-tab-button"]').should('be.visible');
    });

    it('is initially sorted alphabetically by finding name', () => {
      const expectedText = [
        'Deserialization of untrusted data',
        'N plus 1 SQL query',
        'Secret in log',
      ];

      cy.get('[data-cy="finding"]').each((el, index) => {
        cy.wrap(el).should('contain.text', expectedText[index]);
      });
    });

    it('is sorted reverse alphabetically by finding name when the finding name header is clicked', () => {
      cy.get('[data-cy="column-header-name"]').click();

      const expectedText = [
        'Secret in log',
        'N plus 1 SQL query',
        'Deserialization of untrusted data',
      ];

      cy.get('[data-cy="finding"]').each((el, index) => {
        cy.wrap(el).should('contain.text', expectedText[index]);
      });
    });

    it('is sorted by category when the category header is clicked', () => {
      const initialExpectedText = ['Security', 'Performance', 'Security'];

      cy.get('[data-cy="finding"]').each((el, index) => {
        cy.wrap(el).should('contain.text', initialExpectedText[index]);
      });

      cy.get('[data-cy="column-header-category"]').click();
      const sortedExpectedText = ['Performance', 'Security', 'Security'];

      cy.get('[data-cy="finding"]').each((el, index) => {
        cy.wrap(el).should('contain.text', sortedExpectedText[index]);
      });

      cy.get('[data-cy="column-header-category"]').click();
      const reverseSortedExpectedText = ['Security', 'Security', 'Performance'];

      cy.get('[data-cy="finding-table"]')
        .get('[data-cy="finding"]')
        .each((el, index) => {
          cy.wrap(el).should('contain.text', reverseSortedExpectedText[index]);
        });
    });

    it('shows only the relevent findings when clicking a category label', () => {
      cy.get('[data-cy="category-security"]').click();
      cy.get('[data-cy="finding"]')
        .should('have.length', 2)
        .each((el) => {
          cy.wrap(el).should('contain.text', 'Security');
        });

      cy.get('[data-cy="category-performance"]').click();
      cy.get('[data-cy="finding"]')
        .should('have.length', 1)
        .each((el) => {
          cy.wrap(el).should('contain.text', 'Performance');
        });
    });
  });

  describe('with no Impact Domain', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code-analysis-findings--without-impact-domains&args=&viewMode=story'
      );
    });

    it('displays a title', () => {
      cy.get('[data-cy="title"]').should('contain.text', pageTitle);
    });

    it('shows the correct number of findings', () => {
      const numFindings = 5;

      cy.get('[data-cy="category-all"]').should('contain.text', `All: ${numFindings}`);
      cy.get('[data-cy="finding"]').should('have.length', numFindings);
    });

    it('shows the correct category labels', () => {
      const numSecurityFindings = 1;
      const numStabilityFindings = 1;
      const numMaintainabilityFindings = 1;

      cy.get('[data-cy="category-security"]').should(
        'contain.text',
        `Security: ${numSecurityFindings}`
      );
      cy.get('[data-cy="category-stability"]').should(
        'contain.text',
        `Stability: ${numStabilityFindings}`
      );
      cy.get('[data-cy="category-maintainability"]').should(
        'contain.text',
        `Maintainability: ${numMaintainabilityFindings}`
      );
      cy.get('[data-cy="category-performance"]').should('not.exist');
    });

    it('shows the problems tab button', () => {
      cy.get('[data-cy="problems-tab-button"]').should('be.visible');
    });

    it('is initially sorted alphabetically by finding name', () => {
      const expectedText = [
        'Circular Dependency',
        'Deserialization of untrusted data',
        'HTTP 500',
        'N plus 1 SQL query',
        'Secret in log',
      ];

      cy.get('[data-cy="finding"]').each((el, index) => {
        cy.wrap(el).should('contain.text', expectedText[index]);
      });
    });

    it('is sorted reverse alphabetically by finding name when the finding name header is clicked', () => {
      cy.get('[data-cy="column-header-name"]').click();

      const expectedText = [
        'Secret in log',
        'N plus 1 SQL query',
        'HTTP 500',
        'Deserialization of untrusted data',
        'Circular Dependency',
      ];

      cy.get('[data-cy="finding"]').each((el, index) => {
        cy.wrap(el).should('contain.text', expectedText[index]);
      });
    });

    it('is sorted by category when the category header is clicked', () => {
      const initialExpectedText = ['Maintainability', 'Security', 'Stability', '', ''];

      cy.get('[data-cy="finding"]').each((el, index) => {
        cy.wrap(el).should('contain.text', initialExpectedText[index]);
      });

      cy.get('[data-cy="column-header-category"]').click();
      const sortedExpectedText = ['Maintainability', 'Security', 'Stability', '', ''];

      cy.get('[data-cy="finding"]').each((el, index) => {
        cy.wrap(el).should('contain.text', sortedExpectedText[index]);
      });

      cy.get('[data-cy="column-header-category"]').click();
      const reverseSortedExpectedText = ['', '', 'Stability', 'Security', 'Maintainability'];

      cy.get('[data-cy="finding-table"]')
        .get('[data-cy="finding"]')
        .each((el, index) => {
          cy.wrap(el).should('contain.text', reverseSortedExpectedText[index]);
        });
    });

    it('shows only the relevent findings when clicking a category label', () => {
      cy.get('[data-cy="category-security"]').click();
      cy.get('[data-cy="finding"]')
        .should('have.length', 1)
        .each((el) => {
          cy.wrap(el).should('contain.text', 'Security');
        });

      cy.get('[data-cy="category-stability"]').click();
      cy.get('[data-cy="finding"]')
        .should('have.length', 1)
        .each((el) => {
          cy.wrap(el).should('contain.text', 'Stability');
        });

      cy.get('[data-cy="category-maintainability"]').click();
      cy.get('[data-cy="finding"]')
        .should('have.length', 1)
        .each((el) => {
          cy.wrap(el).should('contain.text', 'Maintainability');
        });
    });
  });
});
