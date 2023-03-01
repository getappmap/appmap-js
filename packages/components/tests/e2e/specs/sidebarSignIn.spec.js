describe('Sidebar sign-in page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?args=&id=pages-vs-code--sign-in&viewMode=story');
  });

  it('displays a title', () => {
    cy.get('[data-cy="title"]').should('have.text', 'Activate');
  });

  it('has a sign-in button', () => {
    cy.get('[data-cy="sign-in-button"]').should('have.text', 'Get Started');
  });

  it('informs the user that we do not access their source code', () => {
    const expectedText1 =
      'Authentication with GitHub or GitLab is used solely for verification purposes.';
    const expectedText2 = 'AppMap will\n        not be granted access to source code.';

    const textElement = cy.get('[data-cy="your-data-text"]');
    textElement.should('contain.text', expectedText1);
    textElement.should('contain.text', expectedText2);
  });
});
