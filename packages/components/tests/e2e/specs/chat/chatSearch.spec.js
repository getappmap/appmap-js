context('Chat search', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?args=&id=pages-chatsearch--chat-search-mock-search-prepopulated-empty-results&viewMode=story'
    );
    cy.viewport(1280, 720);
  });

  it('assistant response can be stopped', () => {
    cy.get('[data-cy="chat-input"]', { timeout: 25000 }).clear().type('Hello world{enter}');
    cy.get('[data-cy="stop-response"]').should('exist');
    cy.get('[data-cy="stop-response"]').click();
    cy.get('[data-cy="stop-response"]').should('not.exist');
  });
});
