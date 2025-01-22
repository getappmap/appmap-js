context('Chat search', () => {
  beforeEach(() => {
    cy.visit(
      'http://localhost:6006/iframe.html?args=&id=pages-chatsearch--chat-search-mock-search-prepopulated-empty-results&viewMode=story'
    );
    cy.viewport(1280, 720);
  });

  it('assistant response can be stopped', () => {
    cy.get('[data-cy="chat-input"]', { timeout: 25000 }).clear().type('Hello world{enter}');
    cy.get('[data-cy="stop-response"]').should('exist');
    cy.get('[data-cy="stop-response"]').click();
    cy.get('[data-cy="stop-response"]').should('not.exist');
  });

  describe('focus', () => {
    const input = '[data-cy="chat-input"]';
    it('should focus on the input on page load', () => {
      cy.get(input).should('be.focused');
    });

    it('regains focus when the user comes back to the chat', () => {
      cy.get(input).blur().should('not.be.focused');
      cy.window().trigger('focus');
      cy.get(input).should('be.focused');
    });
  });

  describe('when a file is dropped', () => {
    const listenForFetch = ($div) => {
      const root = $div[0].__vue__.$root;
      return new Cypress.Promise((resolve) => {
        root.$on('fetch-pinned-files', (requests) => {
          resolve(requests);
        });
      });
    };

    it('handles the VS Code Explorer as the source', () => {
      cy.get('[data-cy="chat-search"]').then(($div) => {
        const p = listenForFetch($div);
        cy.wrap($div).trigger('drop', {
          dataTransfer: {
            items: [
              {
                kind: 'string',
                type: 'application/vnd.code.uri-list',
                getAsString: (cb) => {
                  cb('file://src/stories/data/scenario.json');
                },
              },
            ],
          },
        });

        cy.wrap(p).then(async (requests) => {
          expect(requests.length).to.eq(1);
          expect(requests[0]).to.have.keys('name', 'uri', 'content');
        });
      });
    });

    it('handles a source outside VS Code', () => {
      cy.get('[data-cy="chat-search"]').then(($div) => {
        const p = listenForFetch($div);

        cy.wrap($div).selectFile('src/stories/data/scenario.json', {
          action: 'drag-drop',
        });

        cy.wrap(p).then(async (requests) => {
          expect(requests.length).to.eq(1);
          expect(requests[0]).to.have.keys('name', 'uri', 'content');

          // NB: writing this expectation as
          //   expect(requests[0].content).to.satisfy((s) => s.startsWith('{\n  "events": ['));
          // works fine when it passes, but **hangs Cypress** when it fails.
          // So, do this instead:
          expect(requests[0].content.slice(0, 15)).to.eq('{\n  "events": [');
        });
      });
    });
  });
});
