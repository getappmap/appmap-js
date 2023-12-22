context('Component Diagram', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?args=&id=pages-chatsearch--chat-search-mock&viewMode=story'
    );
  });

  it('renders the current state', () => {
    cy.get('[data-cy="chat-input"]', { timeout: 25000 })
      .type('Hello world{enter}', {
        waitForAnimations: false,
        delay: 0,
      })
      .get('[data-cy="explain-status"]', { timeout: 1000 })
      .should('be.visible')
      .should('contain.text', 'Optimizing search terms...');

    cy.get('[data-cy="explain-status"]', { timeout: 1000 }).should(
      'contain.text',
      'Explaining with AI...'
    );

    cy.get('[data-actor="system"] [data-cy="message-text"]').should(
      'contain.text',
      'Based on the code snippets provided'
    );
  });

  it('switches AppMaps', () => {
    cy.get('[data-cy="chat-input"]', { timeout: 25000 }).type('Hello world{enter}');

    // Ruby AppMap
    cy.get('[data-cy="app"] [data-id="app/controllers/Spree::Admin::OrdersController"]', {
      timeout: 10000,
    }).should('be.visible');

    // Java AppMap
    cy.get('[data-cy="appmap-list"]').select('Create Visit For Pet');
    cy.get('[data-cy="app"] [data-id="org/springframework/samples/petclinic/owner"]').should(
      'be.visible'
    );
  });
});
