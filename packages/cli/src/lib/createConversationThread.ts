import { randomUUID } from 'node:crypto';

import { Telemetry } from '@appland/telemetry';

import configuration from '../rpc/configuration';
import ModelRegistry from '../rpc/navie/models/registry';

import { properties } from './telemetryConstants';

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
  const uuid = randomUUID();

  const configurationDirectories = await configuration().appmapDirectories();
  const languages = configurationDirectories.map((dir) => dir.appmapConfig?.language).filter(Boolean);
  const model = ModelRegistry.instance.selectedModel;

  void Telemetry.sendEvent({
    name: 'navie:start-conversation',
    properties: {
      languages: languages.join(',') || undefined,
      [properties.NavieThreadId]: uuid,
      [properties.NavieModelId]: model?.id,
      [properties.NavieModelBaseUrl]: model?.baseUrl,
      [properties.NavieModelProvider]: model?.provider,
      [properties.CommonCodeEditor]: codeEditor,
    },
  });

  return uuid;
}
