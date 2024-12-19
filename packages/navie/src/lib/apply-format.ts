import * as zod from 'zod';

import InteractionHistory, {
  PromptInteractionEvent,
  SchemaInteractionEvent,
} from '../interaction-history';
import { UserOptions } from './parse-options';
import { warn } from 'console';
import assert from 'assert';

export default function applyFormat(
  interactionHistory: InteractionHistory,
  userOptions: UserOptions,
  defaultFormatPrompt: string,
  jsonSchema?: zod.Schema<unknown>
): void {
  const applyJSONFormat = (): boolean => {
    const formatName = userOptions.stringValue('format', undefined);

    if (formatName !== 'json') return false;

    if (!jsonSchema) {
      warn('JSON format requested, but no schema provided');
      return false;
    }

    return true;
  };

  const applyDefault = (): boolean => {
    return userOptions.isEnabled('format', true);
  };

  if (applyJSONFormat()) {
    assert(jsonSchema);
    interactionHistory.addEvent(new SchemaInteractionEvent('system', jsonSchema));
  } else if (applyDefault()) {
    interactionHistory.addEvent(
      new PromptInteractionEvent('format', 'system', defaultFormatPrompt)
    );
  }
}
