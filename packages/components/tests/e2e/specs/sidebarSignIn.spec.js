describe('Sidebar sign-in page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?args=&id=pages-vs-code--sign-in&viewMode=story');
  });

  it('displays a title', () => {
    cy.get('[data-cy="title"]').should('have.text', 'Sign in');
  });

  it('has a sign-in button', () => {
    cy.get('[data-cy="sign-in-button"]').should('have.text', 'Sign in');
  });

  it('informs the user that we do not access their source code', () => {
    const expectedText1 =
      'Authentication with GitHub or GitLab is used solely for issuing a license. AppMap runs in';
    const expectedText2 =
      'your code editor, so your AppMaps and your source code stay on your machine.';

    const textElement = cy.get('[data-cy="your-data-text"]');
    textElement.should('contain.text', expectedText1);
    textElement.should('contain.text', expectedText2);
  });
});
