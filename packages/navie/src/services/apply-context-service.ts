import { warn } from 'console';

import { ContextV2 } from '../context';
import InteractionHistory, {
  ContextItemEvent,
  PromptInteractionEvent,
} from '../interaction-history';
import { PromptType, buildPromptDescriptor } from '../prompt';
import { HelpResponse } from '../help';
import applyContext from '../lib/apply-context';

export default class ApplyContextService {
  constructor(public readonly interactionHistory: InteractionHistory) {}

  applyContext(
    context: ContextV2.ContextResponse | undefined,
    help: HelpResponse,
    characterLimit: number,
    maxContentLength: number = characterLimit / 5
  ) {
    if (!context) {
      this.interactionHistory.addEvent(
        new PromptInteractionEvent(
          'contextLookup',
          'system',
          'No matching context information was found'
        )
      );
      return;
    }

    const contextItems = [
      ...context,
      ...help.map((item) => ({
        type: ContextV2.ContextItemType.HelpDoc,
        content: item.content,
        score: item.score,
        location: item.filePath,
      })),
    ];

    const appliedContextItems = applyContext(contextItems, characterLimit, maxContentLength);
    const charsApplied = appliedContextItems.reduce((acc, item) => acc + item.content.length, 0);
    const charsRemaining = characterLimit - charsApplied;

    for (const item of appliedContextItems) {
      const event = eventOfContextItem(item);
      if (event) this.interactionHistory.addEvent(event);
    }

    this.interactionHistory.log(`Remaining characters after context: ${charsRemaining}`);
  }

  addSystemPrompts(context: ContextV2.ContextResponse, help: HelpResponse) {
    if (!context || context.length === 0) return;

    const hasSequenceDiagram = context.some(
      (item) => item.type === ContextV2.ContextItemType.SequenceDiagram
    );
    const hasCodeSnippet = context.some(
      (item) => item.type === ContextV2.ContextItemType.CodeSnippet
    );
    const hasDataRequest = context.some(
      (item) => item.type === ContextV2.ContextItemType.DataRequest
    );

    if (hasSequenceDiagram)
      this.interactionHistory.addEvent(
        new PromptInteractionEvent(
          PromptType.SequenceDiagram,
          'system',
          buildPromptDescriptor(PromptType.SequenceDiagram)
        )
      );

    if (hasCodeSnippet)
      this.interactionHistory.addEvent(
        new PromptInteractionEvent(
          PromptType.CodeSnippet,
          'system',
          buildPromptDescriptor(PromptType.CodeSnippet)
        )
      );

    if (hasDataRequest)
      this.interactionHistory.addEvent(
        new PromptInteractionEvent(
          PromptType.DataRequest,
          'system',
          buildPromptDescriptor(PromptType.DataRequest)
        )
      );

    if (help.length > 0)
      this.interactionHistory.addEvent(
        new PromptInteractionEvent(
          PromptType.HelpDoc,
          'system',
          buildPromptDescriptor(PromptType.HelpDoc)
        )
      );
  }
}

export function eventOfContextItem(item: ContextV2.ContextItem): undefined | ContextItemEvent {
  let promptType: PromptType | undefined;
  switch (item.type) {
    case ContextV2.ContextItemType.SequenceDiagram:
      promptType = PromptType.SequenceDiagram;
      break;
    case ContextV2.ContextItemType.CodeSnippet:
      promptType = PromptType.CodeSnippet;
      break;
    case ContextV2.ContextItemType.DataRequest:
      promptType = PromptType.DataRequest;
      break;
    case ContextV2.ContextItemType.HelpDoc:
      promptType = PromptType.HelpDoc;
      break;
    case ContextV2.ContextItemType.DirectoryListing:
      promptType = PromptType.DirectoryListing;
    default:
  }
  if (promptType) {
    const isFile = ContextV2.isFileContextItem(item);
    return new ContextItemEvent(
      promptType,
      item.content,
      isFile ? item.location : undefined,
      isFile ? item.directory : undefined
    );
  } else {
    warn(`Unknown context item type: ${item.type} for content: ${item.content}`);
  }
}
