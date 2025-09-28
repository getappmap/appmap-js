/* eslint-disable prefer-const */
import { ExplainRpc } from '@appland/rpc';

import createConversationThread from '../../../../src/lib/createConversationThread';
import { AppMapDirectory } from '../../../../src/rpc/configuration';
import { Explain } from '../../../../src/rpc/explain/explain';
import INavie from '../../../../src/rpc/explain/navie/inavie';

describe('Explain', () => {
  let explain: Explain;
  let appmapDirectories: AppMapDirectory[] = [
    {
      directory: 'the-appmap-directory',
      appmapConfig: {
        name: 'the-appmap-config-name',
        language: 'java',
        packages: [{ path: 'org.example.package1' }],
      },
    },
  ];
  let projectDirectories = ['the-project-directory'];
  let question = 'What is the meaning of life?';
  let codeSelection: string | undefined;
  let appmaps: string[] | undefined;
  let status: ExplainRpc.ExplainStatusResponse;
  let codeEditor: string | undefined;

  beforeEach(() => {
    status = {
      step: ExplainRpc.Step.NEW,
    };
    explain = new Explain(
      appmapDirectories,
      projectDirectories,
      question,
      codeSelection,
      appmaps,
      status,
      codeEditor
    );
  });

  describe('explain', () => {
    const threadId = 'the-thread-id';

    beforeEach(() => {
      jest.mocked(createConversationThread).mockResolvedValue(threadId);
    });

    it('uses the thread id', async () => {
      const navie = {
        ask: jest.fn().mockResolvedValue('the-answer'),
        on: jest.fn(),
      } as unknown as INavie;
      await explain.explain(navie);

      expect(status).toEqual({ step: ExplainRpc.Step.NEW, threadId });
    });
  });
});

jest.mock('../../../../src/lib/createConversationThread');
