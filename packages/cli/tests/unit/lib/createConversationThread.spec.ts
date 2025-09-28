/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Telemetry } from '@appland/telemetry';

import * as AIEnvVar from '../../../src/cmds/index/aiEnvVar';
import createConversationThread from '../../../src/lib/createConversationThread';
import * as Config from '../../../src/rpc/configuration';
import * as LLMConfiguration from '../../../src/rpc/llmConfiguration';

jest.mock('@appland/telemetry');
const sendEvent = jest.mocked(Telemetry.sendEvent);

describe('createConversationThread', () => {
  beforeEach(() => {
    sendEvent.mockClear();
  });

  describe('with minimal options', () => {
    it('collects the conversation metadata', async () => {
      jest.spyOn(Config, 'default').mockReturnValue({
        appmapDirectories: jest.fn().mockResolvedValue([]),
      } as unknown as Config.Configuration);
      jest.spyOn(LLMConfiguration, 'getLLMConfiguration').mockReturnValue({});
      jest.spyOn(AIEnvVar, 'default').mockReturnValue(undefined);

      await createConversationThread();

      expect(sendEvent).toHaveBeenCalledTimes(1);
      expect(sendEvent.mock.calls[0][0]).toMatchObject(
        {
          "metrics": {
            "directoryCount": 0,
          },
          "name": "navie:start-conversation",
          "properties": {
            "common.code_editor": undefined,
            "directories": "[]",
            "appmap.navie.thread_id": expect.any(String),
          },
        });
    });
  });

  describe('with many options', () => {
    it('collects the conversation metadata', async () => {
      jest.spyOn(Config, 'default').mockReturnValue({
        appmapDirectories: jest.fn().mockResolvedValue([
          {
            directory: 'the-appmap-directory',
            appmapConfig: {
              name: 'the-appmap-config-name',
              language: 'java',
              packages: [{ path: 'org.example.package1' }],
            },
          },
        ]),
      } as unknown as Config.Configuration);
      jest.spyOn(LLMConfiguration, 'getLLMConfiguration').mockReturnValue({
        baseUrl: 'the-base-url',
        model: 'the-model',
      });

      jest.spyOn(AIEnvVar, 'default').mockReturnValue('THE_AI_KEY');

      await createConversationThread('vscode');

      expect(sendEvent).toHaveBeenCalledTimes(1);
      expect(sendEvent.mock.calls[0][0]).toMatchObject({
        name: 'navie:start-conversation',
        properties: {
          'appmap.navie.ai_key_name': 'THE_AI_KEY',
          'appmap.navie.model.base_url': 'the-base-url',
          'appmap.navie.model.id': 'the-model',
          directories: JSON.stringify([
            {
              hasAppMapConfig: true,
              language: 'java',
            },
          ]),
          'common.code_editor': 'vscode',
          'appmap.navie.thread_id': expect.any(String),
        },
        metrics: {
          directoryCount: 1,
        },
      });
    });
  });
});
