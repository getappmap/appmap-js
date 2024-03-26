import InteractionHistory, {
  ContextItemEvent,
  ContextLookupEvent,
} from '../src/interaction-history';

describe('InteractionHistory', () => {
  describe('#buildState', () => {
    describe('context lookup event', () => {
      describe('when empty', () => {
        it('leaves state.contextAvailable as undefined', () => {
          const interactionHistory = new InteractionHistory();
          const lookupContextEvent = new ContextLookupEvent(undefined);
          interactionHistory.addEvent(lookupContextEvent);
          const state = interactionHistory.buildState();
          expect(state.messages).toEqual([]);
          expect(state.contextAvailable).toBe(undefined);
        });
      });
      describe('when non-empty', () => {
        it('sets state.contextAvailable', () => {
          const interactionHistory = new InteractionHistory();
          const context = {
            sequenceDiagrams: ['diagram-1'],
            codeSnippets: {
              'file.py': 'code snippet content',
            },
            codeObjects: ['code-object-1'],
          };
          const lookupContextEvent = new ContextLookupEvent(context);
          interactionHistory.addEvent(lookupContextEvent);
          const state = interactionHistory.buildState();
          expect(state.messages).toEqual([]);
          expect(state.contextAvailable).toEqual(context);
        });
      });
    });

    describe('context item event', () => {
      describe('sequence diagram', () => {
        it('adds a message to the state', () => {
          const interactionHistory = new InteractionHistory();
          interactionHistory.addEvent(
            new ContextItemEvent({ name: 'Sequence diagram', content: 'diagram-1' })
          );
          const state = interactionHistory.buildState();
          expect(state.messages).toEqual([
            { content: '[Sequence diagram] diagram-1', role: 'user' },
          ]);
        });
      });
      describe('code snippet', () => {
        it('adds a message to the state', () => {
          const interactionHistory = new InteractionHistory();
          interactionHistory.addEvent(
            new ContextItemEvent(
              { name: 'Code snippet', content: 'code snippet content' },
              'file.py'
            )
          );
          const state = interactionHistory.buildState();
          expect(state.messages).toEqual([
            { content: '[Code snippet] file.py: code snippet content', role: 'user' },
          ]);
        });
      });
      describe('data request', () => {
        it('adds a message to the state', () => {
          const interactionHistory = new InteractionHistory();
          interactionHistory.addEvent(
            new ContextItemEvent({ name: 'Data request', content: 'data request' })
          );
          const state = interactionHistory.buildState();
          expect(state.messages).toEqual([
            { content: '[Data request] data request', role: 'user' },
          ]);
        });
      });
    });
  });
});
