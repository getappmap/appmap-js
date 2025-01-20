import { warn } from 'console';
import { NavieRpc } from '@appland/rpc';
import {
  AI,
  ConversationThread,
  ModelParameters,
  ProjectDirectory,
  ProjectParameters,
} from '@appland/client';

import { RpcHandler } from '../rpc';
import { getLLMConfiguration } from '../llmConfiguration';
import detectAIEnvVar from '../../cmds/index/aiEnvVar';
import configuration from '../configuration';
import ThreadService from './services/threadService';

export async function register(
  threadService: ThreadService,
  codeEditor: string | undefined
): Promise<NavieRpc.V1.Register.Response> {
  const modelParameters = {
    ...getLLMConfiguration(),
  } as ModelParameters;
  const aiKeyName = detectAIEnvVar();
  if (aiKeyName) modelParameters.aiKeyName = aiKeyName;

  const configurationDirectories = await configuration().appmapDirectories();
  const directories = configurationDirectories.map((dir) => {
    const result: ProjectDirectory = {
      hasAppMapConfig: dir.appmapConfig !== undefined,
    };
    if (dir.appmapConfig?.language) {
      result.language = dir.appmapConfig.language;
    }
    return result;
  });

  const projectParameters: ProjectParameters = {
    directoryCount: configurationDirectories.length,
    directories,
  };
  if (codeEditor) projectParameters.codeEditor = codeEditor;

  const thread = await AI.createConversationThread({ modelParameters, projectParameters });
  threadService.registerThread(thread);

  return { thread };
}

export function navieRegisterV1(
  threadService: ThreadService,
  codeEditor?: string
): RpcHandler<NavieRpc.V1.Register.Params, NavieRpc.V1.Register.Response> {
  return {
    name: NavieRpc.V1.Register.Method,
    handler: async () => {
      return register(threadService, codeEditor);
    },
  };
}
