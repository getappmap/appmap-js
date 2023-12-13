context('Fullscreen toggle', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
  });

  it('toggles on and off via click', async () => {
    const requestFullScreen = cy.stub();
    const exitFullscreen = cy.stub();

    let appElement = null;
    cy.get('[data-cy="app"]').then(([el]) => {
      appElement = el;
      appElement.requestFullScreen = requestFullScreen;
    });

    cy.get('[data-cy="fullscreen-button"]')
      .click()
      .then(() => {
        expect(requestFullScreen).to.be.called;
      });

    // Manually set the fullscreenElement property on the document
    // to simulate the browser entering fullscreen mode.
    cy.document().then((doc) => {
      cy.stub(doc, 'fullscreenElement', appElement);
      cy.stub(doc, 'exitFullscreen', exitFullscreen);
    });

    // Similarly, manually trigger the fullscreenchange event
    // The browser won't let an automated test trigger fullscreen without user interaction
    cy.get('[data-cy="app"]').trigger('fullscreenchange');

    cy.get('[data-cy="fullscreen-button"][data-enabled]')
      .click()
      .then(() => {
        expect(exitFullscreen).to.be.called;
      });

    // Manually clear the fullscreenElement
    cy.document().then((doc) => {
      cy.stub(doc, 'fullscreenElement', undefined);
    });

    // Fire the fullscreenchange event again so the frontend can be notified
    cy.get('[data-cy="app"]').trigger('fullscreenchange');

    cy.get('[data-cy="fullscreen-button"]:not([data-enabled])').should('exist');
  });
});
