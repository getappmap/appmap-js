// https://docs.cypress.io/api/introduction/api.html

describe('My First Test', () => {
  it('Visits the app root url', () => {
    cy.visit('/');
    cy.get('.node.class[data-parent-type=http]');
    cy.contains('.class.label', 'DELETE /allies/remove');
  });
});
