/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expectResult", "expect"]}] */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import Gatherer from '../../src/agents/gatherer';
import InteractionHistory, {
  ContextItemEvent,
  ContextItemRequestor,
  type InteractionEvent,
  PromptInteractionEvent,
} from '../../src/interaction-history';
import { PromptType } from '../../src/prompt';
import { Message } from '../../src';
import { PromptTooLongError } from '../../src/services/completion-service';
import ContextService from '../../src/services/context-service';
import ProjectInfoService from '../../src/services/project-info-service';
import MockCompletionService from '../services/mock-completion-service';

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

    // eslint-disable-next-line jest/expect-expect
    it('knows when a diff has already been requested', () => {
      const messages = Gatherer.buildConversation([
        new ContextItemEvent(PromptType.Diff, ContextItemRequestor.ProjectInfo, `diff --git a b`),
      ]);
      expect(messages.map(messageToEventLine).join('\n')).toMatchInlineSnapshot(`
            "system: <SYSTEM PROMPT>
            assistant: !!diff
            user: Here's the diff of the project:
            diff --git a b"
            `);
    });

    it('includes diff information in the conversation when it consists of mixed events', () => {
      const messages = Gatherer.buildConversation([
        new ContextItemEvent(
          PromptType.Diff,
          ContextItemRequestor.ProjectInfo,
          'diff --git a/file1 b/file1'
        ),
        new PromptInteractionEvent(PromptType.Question, 'user', 'What changed in file1?'),
      ]);

      expect(messages.map(messageToEventLine).join('\n')).toMatchInlineSnapshot(`
    "system: <SYSTEM PROMPT>
    user: <USER PROMPT>
    
    <context>
    <user-question>
    What changed in file1?
    </user-question>
    
    
    </context>
    assistant: !!diff
    user: Here's the diff of the project:
    diff --git a/file1 b/file1"
  `);
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

    it('ignores code snippets system prompt', () => {
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
      return Gatherer.buildConversation(events.map(eventDataToInteractionEvent))
        .map(messageToEventLine)
        .join('\n');
    }

    function messageToEventLine(event: Message): string {
      return [
        event.role,
        event.content
          .replace(Gatherer.SYSTEM_PROMPT, '<SYSTEM PROMPT>')
          .replace(Gatherer.USER_PROMPT, '<USER PROMPT>')
          .trim(),
      ].join(': ');
    }

    function eventDataToInteractionEvent(ev: EventData): InteractionEvent {
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
            ContextItemRequestor.Gatherer,
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
  describe('executeCommands', () => {
    const gatherer = () =>
      new Gatherer(events, interactionHistory, completion, context, projectInfoService);

    describe('diff', () => {
      // eslint-disable-next-line jest/expect-expect
      it('fetches diff info via project info', async () => {
        (projectInfoService.lookupProjectInfo as jest.Mock).mockResolvedValue([
          {
            directory: '/test/appmap-server',
            diff: 'diff --git a b',
          },
        ]);

        const messages = await gatherer().executeCommands(['!!diff']);
        expect(messages).toEqual(
          `Here's the diff of the project:
diff --git a b

`
        );

        expect(interactionHistory.events.map((event) => event.metadata)).toEqual([
          {
            name: 'Diff',
            role: 'system',
            type: 'prompt',
          },
          {
            promptType: 'Diff',
            type: 'contextItem',
          },
        ]);
      });
      // eslint-disable-next-line jest/expect-expect
      it('fetches and combines diffs from multiple projects', async () => {
        (projectInfoService.lookupProjectInfo as jest.Mock).mockResolvedValue([
          {
            directory: '/test/project1',
            diff: 'diff --git a/project1/file1 b/project1/file1',
          },
          {
            directory: '/test/project2',
            diff: 'diff --git a/project2/file2 b/project2/file2',
          },
        ]);

        const messages = await gatherer().executeCommands(['!!diff']);
        expect(messages).toContain('diff --git a/project1/file1 b/project1/file1');
        expect(messages).toContain('diff --git a/project2/file2 b/project2/file2');
      });
      it('handles empty diffs correctly', async () => {
        (projectInfoService.lookupProjectInfo as jest.Mock).mockResolvedValue([
          {
            directory: '/test/project',
            diff: '',
          },
        ]);

        const messages = await gatherer().executeCommands(['!!diff']);
        expect(messages).toBe('');
      });
      it('handles errors when fetching diffs', async () => {
        (projectInfoService.lookupProjectInfo as jest.Mock).mockRejectedValue(
          new Error('Fetch error')
        );

        await expect(gatherer().executeCommands(['!!diff'])).rejects.toThrow('Fetch error');
      });
      it('executes diff command along with other commands', async () => {
        (projectInfoService.lookupProjectInfo as jest.Mock).mockResolvedValue([
          {
            directory: '/test/project',
            diff: 'diff --git a b',
          },
        ]);
        (context.searchContextWithLocations as jest.Mock).mockResolvedValue([
          new ContextItemEvent(
            PromptType.CodeSnippet,
            ContextItemRequestor.Gatherer,
            'code snippet',
            'file.ts',
            '/test/project'
          ),
        ]);

        const messages = await gatherer().executeCommands([
          '!!diff',
          '!!find /test/project',
          '!!cat file.ts',
        ]);
        expect(messages).toContain('diff --git a b');
        expect(messages).toContain('code snippet');
      });
    });
  });

  describe('step', () => {
    it('throws an error if context length is exceeded', async () => {
      completion.maxTokens = 1000;
      completion.completion.mockImplementationOnce(() => {
        throw new PromptTooLongError(undefined, 1100, 1000);
      });

      await expect(gatherer.step()).rejects.toThrow(PromptTooLongError);
    });

    let gatherer: Gatherer;
    beforeEach(() => {
      gatherer = new Gatherer(events, interactionHistory, completion, context, projectInfoService);
    });
  });
});

const events: InteractionEvent[] = [];
const interactionHistory: InteractionHistory = new InteractionHistory();
const completion = new MockCompletionService();
const context: ContextService = {
  searchContextWithLocations: jest.fn(),
} as any;
const projectInfoService: ProjectInfoService = {
  lookupProjectInfo: jest.fn(),
  promptProjectInfo: jest.fn(),
} as any;
