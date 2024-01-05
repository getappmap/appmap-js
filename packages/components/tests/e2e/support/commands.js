// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

// Call this command after calling cy.visit() to disable smooth scrolling
Cypress.Commands.add('disableSmoothScrolling', () => {
  cy.window().then((win) => {
    const originalScrollIntoView = win.Element.prototype.scrollIntoView;

    // Calling scrollIntoView with { behavior: 'smooth' } causes problems with Cypress
    // so we delete the behavior property before calling scrollIntoView
    // see https://github.com/cypress-io/cypress/issues/805
    cy.stub(win.Element.prototype, 'scrollIntoView').callsFake(async function (args) {
      delete args.behavior;
      originalScrollIntoView.apply(this, args);
    });
  });
});
