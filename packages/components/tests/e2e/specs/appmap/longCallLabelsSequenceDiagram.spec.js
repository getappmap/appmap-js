context('Sequence Diagram', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?args=scenario:longCallLabels&id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
    );
  });

  it('shows truncated long call labels', () => {
    // Increase collapse depth to ensure tested action label is open
    const increaseSelector = 'button[data-cy="increase-collapse-depth"]';
    cy.get(increaseSelector).invoke('show');
    for (let i = 0; i < 5; i++) cy.get(increaseSelector).click();

    // It (span) must be constrained by 5 * 160 = 800px max width.
    // 5 is the number of lanes between caller (activerecord) and callee (Database)
    cy.get('.name div:has(span:contains("SELECT \\"spree_sample_changes\\""))').should(
      'have.css',
      'max-width',
      '800px'
    );
  });
});
