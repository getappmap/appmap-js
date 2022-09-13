context('Explore AppMaps (Full)', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages-explore-appmaps--partial-page&args=&viewMode=story'
    );
  });

  it('displays a title', () => {
    cy.get('[data-cy="title"]').should('contain.text', 'Explore AppMaps');
  });

  it('does not show the No AppMaps message', () => {
    cy.get('[data-cy="no-appmaps"]').should('not.exist');
  });

  it('shows Selected Code Objects', () => {
    cy.get('[data-cy="code-objects"]').should('be.visible');
  });

  it('shows Selected AppMaps', () => {
    cy.get('[data-cy="appmaps"]').should('be.visible');
  });

  it('shows four HTTP requests', () => {
    cy.get('[data-cy="httpRequest"]').should('have.length', 4);
  });

  it('shows two SQL queries', () => {
    cy.get('[data-cy="query"]').should('have.length', 2);
  });

  it('shows seven AppMaps', () => {
    cy.get('[data-cy="appmap"]').should('have.length', 7);
  });
});
