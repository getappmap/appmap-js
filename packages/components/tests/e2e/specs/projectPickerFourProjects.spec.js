context('Project Picker (Four Projects)', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?id=pages-vs-code-install-guide-pages-project-picker--four-projects&args=&viewMode=story'
    );
  });

  it('displays a title', () => {
    cy.get('[data-cy="title"]').should('contain.text', 'Add AppMap to your project');
  });

  it('does not show empty state content', () => {
    cy.get('[data-cy="empty-state-content').should('not.exist');
  });

  it('displays a message indicating that there are multiple projects', () => {
    cy.get('[data-cy="multiple-projects-text"]').should('contain.text', 'multiple projects');
  });

  it('has four rows', () => {
    cy.get('[data-cy="project-picker-row"]').should('have.length', 4);
  });

  it('does not show requirements before selecting a project', () => {
    cy.get('[data-cy="requirements-title"]').should('not.exist');
  });

  it('shows instructions after selecting a project', () => {
    cy.get('[data-cy="project-picker-row"]').first().click();
    cy.get('[data-cy="automated-install"]').should('be.visible');
    cy.get('[data-cy="manual-install"]').should('be.visible');
  });

  it('shows next button when selecting a supported project', () => {
    cy.get('[data-cy="project-picker-row"][data-supported="true"]').first().click();
    cy.get('[data-cy="project-picker-row"][data-supported="true"] [data-cy="next-button"]').should(
      'be.visible'
    );
  });

  it('does not show back button when selecting a supported project', () => {
    cy.get('[data-cy="project-picker-row"][data-supported="true"]').first().click();
    cy.get('[data-cy="project-picker-row"][data-supported="true"] [data-cy="back-button"]').should(
      'not.exist'
    );
  });

  it('shows code snippet when selecting a supported project', () => {
    cy.get('[data-cy="project-picker-row"][data-supported="true"]').first().click();
    cy.get('[data-cy="project-picker-row"][data-supported="true"] [data-cy="code-snippet"]').should(
      'be.visible'
    );
  });

  it('shows an install button when selecting a supported project', () => {
    cy.get('[data-cy="project-picker-row"][data-supported="true"]').first().click();
    cy.get(
      '[data-cy="project-picker-row"][data-supported="true"] [data-cy="automated-install"]'
    ).should('be.visible');
  });

  it('should not show next button when selecting an unsupported project', () => {
    cy.get('[data-cy="project-picker-row"]:not([data-supported])').first().click();
    cy.get('[data-cy="project-picker-row"]:not([data-supported]) [data-cy="next-button"]').should(
      'not.exist'
    );
  });

  it('should not show back button when selecting an unsupported project', () => {
    cy.get('[data-cy="project-picker-row"]:not([data-supported])').first().click();
    cy.get('[data-cy="project-picker-row"]:not([data-supported]) [data-cy="back-button"]').should(
      'not.exist'
    );
  });

  it('unsupported project does not contain a call to action', () => {
    cy.get('[data-cy="project-picker-row"]:not([data-supported])').first().click();
    cy.get('[data-cy="project-picker-row"]:not([data-supported]) button').should('not.exist');
    cy.get('[data-cy="project-picker-row"]:not([data-supported]) [data-cy="code-snippet"]').should(
      'not.exist'
    );
  });
});
