context('Fullscreen toggle', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
  });

  it('toggles on and off', () => {
    cy.get('[data-cy="fullscreen-button"]:not([data-enabled])').click();
    cy.get('[data-cy="fullscreen-button"][data-enabled]').click();
  });
});
