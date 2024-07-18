context('Export', () => {
  context('from the dependency map view', () => {
    beforeEach(() => {
      cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
    });

    it('shows the JSON option (only)', () => {
      cy.get('.popper[data-cy="export-button"]').should('exist');
    });
  });
  context('from the sequence diagram view', () => {
    beforeEach(() => {
      cy.visit(
        'http://localhost:6006/iframe.html?id=pages-vs-code--extension-with-default-sequence-view'
      );
    });

    it('shows JSON and SVG options', () => {
      cy.get('[data-cy="export-button"] [data-cy="popper-button"]').click();
      cy.get('[data-cy="export-button"] [data-cy="export-dropdown"]')
        .contains('JSON')
        .should('exist');
      cy.get('[data-cy="export-button"] [data-cy="export-dropdown"]')
        .contains('SVG')
        .should('exist');
    });
  });
});
