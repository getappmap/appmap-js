context('AppMap sharing', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
  });
  it('opens and closes with the Share button', () => {
    cy.get('[data-cy="share-button"]').click();
    cy.get('.share-appmap').should('exist').find('.url').should('have.text', 'Retrieving link...');
    cy.get('.close-me').click();
    cy.get('.share-appmap').should('not.exist');
  });
});
