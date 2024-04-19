context('Chat search', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?args=&id=pages-chatsearch--chat-search-mock-search-prepopulated-empty-results&viewMode=story'
    );
    cy.viewport(1280, 720);
  });

  it('does not show the context status when the user is chatting', () => {
    cy.get('[data-cy="status-bar"]').should('be.visible');
    cy.get('[data-cy="chat-input"]', { timeout: 25000 }).type('Hello world{enter}');
    cy.get('[data-cy="status-bar"]').should('not.exist');
  });
});
