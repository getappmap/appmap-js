context('Chat search', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?args=&id=pages-chatsearch--chat-search-mock&viewMode=story'
    );
    cy.viewport(1280, 720);
  });

  it('switches AppMaps', () => {
    cy.get('[data-cy="chat-input"]', { timeout: 25000 }).type('Hello world{enter}');

    // Ruby AppMap
    cy.get('[data-cy="app"] [data-id="GET /admin"]', {
      timeout: 10000,
    }).should('be.visible');

    // Java AppMap
    cy.get('[data-cy="appmap-list"]').select('Create Visit For Pet');
    cy.get('[data-cy="app"] [data-id="org/springframework/samples/petclinic/owner"]').should(
      'be.visible'
    );
  });

  it('selects multiple objects in the AppMap', () => {
    cy.get('[data-cy="chat-input"]', { timeout: 25000 }).type('Hello world{enter}');

    // Initial state
    cy.get('[data-cy="app"] [data-id="GET /admin"].highlight');

    cy.get('[data-cy="select-object"]').select(0);
    cy.get('[data-cy="app"] [data-id="app/controllers/Spree::Admin::OrdersController"].highlight');

    cy.get('[data-cy="select-object"]').select(1);
    cy.get('[data-cy="app"] [data-id="GET /admin"].highlight');
  });

  it('new chat button clears the state', () => {
    cy.get('[data-cy="chat-input"]', { timeout: 25000 }).type('Hello world{enter}');

    // Ruby AppMap should be visible
    cy.get('[data-cy="app"] [data-id="GET /admin"]', {
      timeout: 10000,
    }).should('be.visible');

    cy.get('[data-cy="new-chat-btn"]').click();

    // Ruby AppMap should not be visible
    cy.get('[data-cy="app"] [data-id="GET /admin"]', {
      timeout: 10000,
    }).should('not.exist');
  });
});
