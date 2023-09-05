context('Filter Menu Test', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?args=&id=appland-diagrams-filter-menu--filter-menu&viewMode=story'
    );
  });

  it('Change Filters, Add Filter and Select New Filter', () => {
    cy.get(
      '#root > div > div:nth-child(3) > div.filters__block-body > div:nth-child(3) > label'
    ).click();

    cy.get(
      '#root > div > div:nth-child(3) > div.filters__block-body > div:nth-child(7) > input'
    ).type('Filter A');

    cy.get(
      '#root > div > div:nth-child(3) > div.filters__block-body > div:nth-child(7) > button'
    ).click();

    cy.get(
      '#root > div > div:nth-child(4) > div.filters__block-body.filters__block-body > div:nth-child(1) > div > select'
    ).select('filter');

    cy.get(
      '#root > div > div:nth-child(4) > div.filters__block-body.filters__block-body > div:nth-child(2) > div > button:nth-child(1)'
    ).click();
  });

  it('Change Filters and Select New Filter', () => {
    cy.get(
      '#root > div > div:nth-child(3) > div.filters__block-body > div:nth-child(3) > label'
    ).click();

    cy.get(
      '#root > div > div:nth-child(3) > div.filters__block-body > div:nth-child(1) > label'
    ).click();

    cy.get(
      '#root > div > div:nth-child(4) > div.filters__block-body.filters__block-body > div:nth-child(1) > div > select'
    ).select('filter');

    cy.get(
      '#root > div > div:nth-child(4) > div.filters__block-body.filters__block-body > div:nth-child(2) > div > button:nth-child(1)'
    ).click();
  });
});
