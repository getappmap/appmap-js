import { ContextV2 } from '../src/context';
import InteractionHistory, {
  ContextItemEvent,
  ContextLookupEvent,
} from '../src/interaction-history';
import { PromptType } from '../src/prompt';

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
          const context: ContextV2.ContextResponse = [
            {
              type: ContextV2.ContextItemType.SequenceDiagram,
              content: 'diagram-1',
            },
            {
              type: ContextV2.ContextItemType.CodeSnippet,
              content: 'code snippet content',
              location: 'file.py',
            } as ContextV2.FileContextItem,
            {
              type: ContextV2.ContextItemType.DataRequest,
              content: 'data request',
            },
          ];
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
            new ContextItemEvent(PromptType.SequenceDiagram, 'diagram-1')
          );
          const state = interactionHistory.buildState();
          expect(state.messages).toEqual([
            { content: '[sequence-diagram] diagram-1', role: 'user' },
          ]);
        });
      });
      describe('code snippet', () => {
        it('adds a message to the state', () => {
          const interactionHistory = new InteractionHistory();
          interactionHistory.addEvent(
            new ContextItemEvent(PromptType.CodeSnippet, 'code snippet content', 'file.py')
          );
          const state = interactionHistory.buildState();
          expect(state.messages).toEqual([
            { content: '[code-snippet] file.py: code snippet content', role: 'user' },
          ]);
        });
      });
      describe('data request', () => {
        it('adds a message to the state', () => {
          const interactionHistory = new InteractionHistory();
          interactionHistory.addEvent(new ContextItemEvent(PromptType.DataRequest, 'data request'));
          const state = interactionHistory.buildState();
          expect(state.messages).toEqual([
            { content: '[data-request] data request', role: 'user' },
          ]);
        });
      });
    });
  });
});
