context('AppMap instructions', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=pages-vs-code--extension&viewMode=story');
  });

  it('open when the instructions icon is clicked', () => {
    cy.get('.instructions__icon').click();
    cy.get('.instructions__container').should('be.visible');

    cy.get('.instructions__close').click();
    cy.get('.instructions__container').should('not.exist');
  });
});
