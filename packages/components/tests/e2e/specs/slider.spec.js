const plusRegex = /^\u002B$/;
const minusRegex = /^\u2212$/;

context('slider', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?id=appland-ui-slider--slider&viewMode=story');
    cy.viewport(100, 200);
  });

  it('contains the minus and plus button', () => {
    const buttons = cy.get('.button');
    cy.get('.button').contains(plusRegex);
    cy.get('.button').contains(minusRegex);
  });

  it('moves grab handle up when clicking on plus', () => {
    cy.get('.grab').then(([grab]) => {
      const { y: y0 } = grab.getBoundingClientRect();
      cy.get('.button').contains(plusRegex).click();
      cy.get('.grab').then(([grab]) => {
        const { y: y1 } = grab.getBoundingClientRect();
        expect(y1).to.be.below(y0);
      });
    });
  });

  it('moves grab handle down when clicking on minus', () => {
    cy.get('.grab').then(([grab]) => {
      const { y: y0 } = grab.getBoundingClientRect();
      cy.get('.button').contains(minusRegex).click();
      cy.get('.grab').then(([grab]) => {
        const { y: y1 } = grab.getBoundingClientRect();
        expect(y1).to.be.above(y0);
      });
    });
  });
});
