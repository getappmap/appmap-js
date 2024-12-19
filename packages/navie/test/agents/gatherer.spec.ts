/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expectResult"]}] */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import Gatherer from '../../src/agents/gatherer';
import {
  ContextItemEvent,
  type InteractionEvent,
  PromptInteractionEvent,
} from '../../src/interaction-history';

describe('Gatherer', () => {
  describe('buildConversation', () => {
    it('transforms interaction history events into a conversation', () => {
      const history = JSON.parse(
        readFileSync(path.resolve(__filename, '../examples/interaction-history.json'), 'utf-8')
      ) as { events: EventData[] };
      expectResult(history.events).toMatchSnapshot();
    });
    it('ignores irrelevant events', () => {
      expectResult([
        {
          type: 'classification',
          classification: [
            {
              name: 'feature',
              weight: 'medium',
            },
          ],
        },
      ]).toMatchInlineSnapshot(`"system: <SYSTEM PROMPT>"`);
    });

    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('adds prompts into the system prompt', () => {
      expectResult([
        {
          type: 'prompt',
          name: 'appmapConfig',
          role: 'system',
          content: "**AppMap configuration**\n\nYou're provided with all AppMap configuration",
        },

        {
          type: 'prompt',
          name: 'appmapStats',
          role: 'system',
          content: "**AppMap statistics**\n\nYou're provided with information about the AppMaps",
        },
      ]).toMatchInlineSnapshot(`
        "system: <SYSTEM PROMPT>



        **AppMap configuration**

        You're provided with all AppMap configuration

        **AppMap statistics**

        You're provided with information about the AppMaps"
      `);
    });

    it('ignores code snippets prompt', () => {
      expectResult([
        {
          type: 'prompt',
          name: 'codeSnippets',
          role: 'system',
          content: "**Code snippets**\n\nYou're provided with code snippets",
        },
      ]).toMatchInlineSnapshot(`"system: <SYSTEM PROMPT>"`);
    });

    it('formats code snippets and other context items in context', () => {
      expectResult([
        {
          type: 'contextItem',
          promptType: 'codeSnippets',
          content:
            '# @label security.api_key.touch\n    def touch(api_key)\n      if api_key.last_used.nil?',
          location: 'app/models/api_key.rb:53',
          directory: '/test/appmap-server',
        },

        {
          type: 'contextItem',
          promptType: 'sequenceDiagrams',
          content:
            '@startuml\n!includeurl https://raw.githubusercontent.com/getappmap/plantuml-theme/main/appmap-theme.puml\nparticipant',
          location: '/test/appmap-server/tmp/appmap',
          directory: '/test/appmap-server',
        },

        {
          type: 'contextItem',
          promptType: 'codeSnippets',
          content:
            '# @label security.api_key.revoke\n    def revoke_from_user(login, key_id)\n      DAO::ApiKey',
          location: 'app/models/api_key.rb:66',
          directory: '/test/appmap-server',
        },
      ]).toMatchInlineSnapshot(`
        "system: <SYSTEM PROMPT>
        user: <USER PROMPT>

        <context>
        <sequence-diagram location="/test/appmap-server/tmp/appmap" project-directory="/test/appmap-server">
        @startuml
        !includeurl https://raw.githubusercontent.com/getappmap/plantuml-theme/main/appmap-theme.puml
        participant
        </sequence-diagram>

        </context>
        assistant: !!cat /test/appmap-server/app/models/api_key.rb:53
        !!cat /test/appmap-server/app/models/api_key.rb:66
        user: Here's the output of \`cat -n /test/appmap-server/app/models/api_key.rb:53\`:
            53	# @label security.api_key.touch
            54	    def touch(api_key)
            55	      if api_key.last_used.nil?

        Here's the output of \`cat -n /test/appmap-server/app/models/api_key.rb:66\`:
            66	# @label security.api_key.revoke
            67	    def revoke_from_user(login, key_id)
            68	      DAO::ApiKey"
      `);
    });

    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('puts the agent prompt in the context', () => {
      expectResult([
        {
          type: 'prompt',
          name: 'agent',
          role: 'system',
          content: '**Task: Specification of Software Issues**\n\n## About you**',
        },
      ]).toMatchInlineSnapshot(`
        "system: <SYSTEM PROMPT>
        user: <USER PROMPT>

        <context>
        <task>
        **Task: Specification of Software Issues**

        ## About you**
        </task>


        </context>"
      `);
    });

    type EventData = Record<string, unknown>;

    // eslint-disable-next-line jest/valid-expect
    const expectResult = (xs: readonly EventData[]) => expect(perform(xs));

    function perform(events: readonly EventData[]) {
      return Gatherer.buildConversation(events.map(event))
        .map(({ role, content }) =>
          [
            role,
            content
              .replace(Gatherer.SYSTEM_PROMPT, '<SYSTEM PROMPT>')
              .replace(Gatherer.USER_PROMPT, '<USER PROMPT>')
              .trim(),
          ].join(': ')
        )
        .join('\n');
    }

    function event(ev: EventData): InteractionEvent {
      switch (ev.type) {
        case 'prompt':
          return new PromptInteractionEvent(
            String(ev.name) ?? 'test',
            (ev.role ?? 'system') as never,
            String(ev.content)
          );
        case 'contextItem':
          return new ContextItemEvent(
            (String(ev.promptType) ?? 'test') as never,
            String(ev.content),
            ev.location as never,
            ev.directory as never
          );
        default:
          return {
            type: 'test',
            message: '',
            metadata: {},
            updateState() {},
            ...ev,
          };
      }
    }
  });
});