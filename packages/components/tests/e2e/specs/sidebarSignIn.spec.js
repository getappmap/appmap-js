describe('Sidebar activation page', () => {
  const INVALID_EMAIL_MSG = 'Invalid email address, please try again.';
  const GENERIC_ERROR_MSG = 'Something went wrong, please try again later.';
  const TEST_EMAIL = 'fake@test.net';

  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?args=&id=pages-vs-code--sign-in&viewMode=story');
  });

  it('displays a title', () => {
    cy.get('[data-cy="title"]').should('have.text', 'Activate AppMap');
  });

  it('has activation buttons', () => {
    cy.get('[data-cy="github-activation-button"]')
      .should('contain.text', 'Activate with')
      .should('contain.text', 'GitHub');
    cy.get('[data-cy="gitlab-activation-button"]')
      .should('contain.text', 'Activate with')
      .should('contain.text', 'GitLab');
    cy.get('[data-cy="email-activation-button"]')
      .should('contain.text', 'Activate with')
      .should('contain.text', 'Email');
  });

  it('informs the user that we do not access their source code', () => {
    const expectedText1 =
      'Your email address is used solely to issue you an AppMap license. Your source code and';
    const expectedText2 =
      'AppMaps stay on your machine when you use AppMap diagrams and runtime analysis. Consult';

    cy.get('[data-cy="your-data-text"]')
      .should('contain.text', expectedText1)
      .should('contain.text', expectedText2);
  });

  it('shows an error message for an invalid email', () => {
    cy.intercept('POST', 'https://getappmap.com/api/activations*', {
      statusCode: 422,
    });
    cy.get('[data-cy="email-activation-button"]').click();
    cy.get('.error').should('contain.text', INVALID_EMAIL_MSG);
  });

  it('shows an error message for a server error', () => {
    cy.intercept('POST', 'https://getappmap.com/api/activations*', {
      statusCode: 500,
    });
    cy.get('[data-cy="email-activation-button"]').click();
    cy.get('.error').should('contain.text', GENERIC_ERROR_MSG);
  });

  it('shows verification code page upon successful email submission', () => {
    cy.intercept('POST', 'https://getappmap.com/api/activations*', {
      statusCode: 201,
    });
    cy.get('#email-input').type(TEST_EMAIL);
    cy.get('[data-cy="email-activation-button"]').click();
    cy.get('.finish-activation').should('exist');
  });

  it('allows the user to retry from the verification code page', () => {
    cy.intercept('POST', 'https://getappmap.com/api/activations*', {
      statusCode: 201,
    });
    cy.get('#email-input').type(TEST_EMAIL).type('{enter}');
    cy.get('.no-email .link').click();
    cy.get('#email-input').should('have.value', '');
  });

  it('does not show the organization configuration prompt by default', () => {
    cy.get('[data-cy="org-config-prompt"]').should('not.exist');
    cy.get('[data-cy="org-config-applied"]').should('not.exist');
  });

  it('shows an error message with incorrect verification code', () => {
    cy.intercept('POST', 'https://getappmap.com/api/activations*', {
      statusCode: 201,
    });
    cy.get('#email-input').type(TEST_EMAIL);
    cy.get('[data-cy="email-activation-button"]').click();
    cy.intercept('POST', 'https://getappmap.com/api/activations/verify*', {
      statusCode: 422,
    });
    cy.get('#verification-code-input').type('1234').type('{enter}');
    cy.get('.error').should('contain.text', 'Invalid verification code, please try again.');
  });
});

describe('Sidebar activation page with organization configuration enabled', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?args=&id=pages-vs-code--sign-in-with-org-config&viewMode=story'
    );
  });

  it('shows the organization configuration prompt', () => {
    cy.get('[data-cy="org-config-prompt"]').should(
      'contain.text',
      'Using AppMap through your organization?'
    );
    cy.get('[data-cy="org-config-link"]').should(
      'contain.text',
      'Apply your organization’s configuration first'
    );
    cy.get('[data-cy="org-config-applied"]').should('not.exist');
  });

  it('shows a confirmation once the configuration has been applied', () => {
    // The story wrapper acts as the host: it answers apply-org-config by
    // calling onOrgConfigApplied() on the component.
    cy.get('[data-cy="org-config-link"]').click();
    cy.get('[data-cy="org-config-prompt"]').should('not.exist');
    cy.get('[data-cy="org-config-applied"]')
      .should('contain.text', 'Organization configuration applied.')
      .should('contain.text', 'Now activate with your work email above.');
  });
});
