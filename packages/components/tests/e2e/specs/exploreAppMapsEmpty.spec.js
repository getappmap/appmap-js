context('Explore AppMaps (Empty)', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages-explore-appmaps--empty-page&args=&viewMode=story'
    );
  });

  it('displays a title', () => {
    cy.get('[data-cy="title"]').should('contain.text', 'Explore AppMaps');
  });

  it('shows the No AppMaps message', () => {
    cy.get('[data-cy="no-appmaps"]').should('contain.text', 'No AppMaps');
  });

  it('does not show Code Objects', () => {
    cy.get('[data-cy="code-objects"]').should('not.exist');
  });

  it('does not show AppMaps', () => {
    cy.get('[data-cy="appmaps"]').should('not.exist');
  });
});
