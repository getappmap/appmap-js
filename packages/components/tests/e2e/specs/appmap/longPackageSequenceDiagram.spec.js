context('Sequence Diagram', () => {
  beforeEach(() => {

    cy.visit(
        'http://localhost:6006/iframe.html?args=scenario:longPackage&id=pages-vs-code--extension-with-default-sequence-view&viewMode=story'
      );
  });

  it('shows simple name instead of long package name', () => {
    // org.springframework.samples.petclinic.owner.Owner 
    // should be displayed as Owner
    cy.get('.label .name').eq(4).should('have.text', 'Owner');
  });
});
