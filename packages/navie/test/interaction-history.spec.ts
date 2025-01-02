import * as zod from 'zod';

import { ContextV2 } from '../src/context';
import InteractionHistory, {
  ContextItemEvent,
  ContextLookupEvent,
  SchemaInteractionEvent,
} from '../src/interaction-history';
import { PromptType } from '../src/prompt';
import InteractionState from '../src/interaction-state';

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
            { content: '<context>', role: 'system' },
            { content: '<sequence-diagram>\ndiagram-1\n</sequence-diagram>', role: 'system' },
            { content: '</context>', role: 'system' },
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
            { content: '<context>', role: 'system' },
            {
              content: '<code-snippet location="file.py">\ncode snippet content\n</code-snippet>',
              role: 'system',
            },
            { content: '</context>', role: 'system' },
          ]);
        });
        it('provides project-directory if directory is set', () => {
          const location = 'file.py';
          const projectDirectory = '/home/user/dev/my-project';
          const interactionHistory = new InteractionHistory();
          interactionHistory.addEvent(
            new ContextItemEvent(
              PromptType.CodeSnippet,
              'code snippet content',
              location,
              projectDirectory
            )
          );
          const state = interactionHistory.buildState();
          expect(state.messages).toEqual([
            { content: '<context>', role: 'system' },
            {
              content: `<code-snippet location="${location}" project-directory="${projectDirectory}">\ncode snippet content\n</code-snippet>`,
              role: 'system',
            },
            { content: '</context>', role: 'system' },
          ]);
        });
      });
      describe('data request', () => {
        it('adds a message to the state', () => {
          const interactionHistory = new InteractionHistory();
          interactionHistory.addEvent(new ContextItemEvent(PromptType.DataRequest, 'data request'));
          const state = interactionHistory.buildState();
          expect(state.messages).toEqual([
            { content: '<context>', role: 'system' },
            { content: '<data-request>\ndata request\n</data-request>', role: 'system' },
            { content: '</context>', role: 'system' },
          ]);
        });
      });
    });
  });
});

describe('SchemaInteractionEvent', () => {
  it('should instantiate correctly', () => {
    const schema = zod.object({ key: zod.string() });
    const event = new SchemaInteractionEvent('assistant', schema, 'default');

    expect(event.role).toBe('assistant');
    expect(event.schema).toBe(schema);
    expect(event.defaultResponse).toBe('default');
  });

  it('should return correct metadata', () => {
    const schema = zod.object({});
    const event = new SchemaInteractionEvent('system', schema, null);

    expect(event.metadata).toEqual({ type: 'schema' });
  });

  it('should produce the correct message string', () => {
    const schema = zod.object({ key: zod.number() });
    const event = new SchemaInteractionEvent('user', schema, 42);

    expect(event.message).toContain('[schema]');
  });

  it('should update interaction state properly', () => {
    const schema = zod.object({ key: zod.string() });
    const state = new InteractionState();
    const event = new SchemaInteractionEvent('user', schema, 'default');

    event.updateState(state);

    expect(state.schema).toBe(schema);
    expect(state.defaultResponse).toBe('default');
  });
});
