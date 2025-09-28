import type { ModelParameters, ProjectDirectory, ProjectParameters } from '@appland/client';
import { Telemetry } from '@appland/telemetry';

import detectAIEnvVar from '../cmds/index/aiEnvVar';
import configuration from '../rpc/configuration';
import { getLLMConfiguration, type LLMConfiguration } from '../rpc/llmConfiguration';

import { properties } from './telemetryConstants';

async function buildConversationParameters(
  codeEditor?: string
): Promise<{ modelParameters: ModelParameters & LLMConfiguration; projectParameters: ProjectParameters }> {
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

  return { modelParameters, projectParameters };
}

/**
 * Creates a new conversation thread for Navie.
 *
 * In the past, with a remote Navie service, this function would have created a persistent entity
 * on the backend. Now that Navie is a local-only feature, this function's primary purpose is to
 * generate a unique identifier (UUID) for the conversation and send a telemetry event to mark
 * its beginning. This "thread ID" is then used to correlate subsequent telemetry events related
 * to the same conversation.
 *
 * @param codeEditor The code editor being used, if any.
 * @returns A promise that resolves to the new conversation thread ID (UUID).
 */
export default async function createConversationThread(codeEditor?: string): Promise<string> {
  const { modelParameters, projectParameters } = await buildConversationParameters(codeEditor);
  const uuid = crypto.randomUUID();

  void Telemetry.sendEvent({
    name: 'navie:start-conversation',
    properties: {
      directories: JSON.stringify(projectParameters.directories),
      [properties.NavieThreadId]: uuid,
      [properties.NavieModelId]: modelParameters.model,
      [properties.NavieModelBaseUrl]: modelParameters.baseUrl,
      [properties.NavieModelProvider]: modelParameters.provider,
      [properties.NavieAIKeyName]: modelParameters.aiKeyName,
      [properties.CommonCodeEditor]: projectParameters.codeEditor,
    },
    metrics: {
      directoryCount: projectParameters.directoryCount,
    }
  });

  return uuid;
}
