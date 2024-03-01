/* eslint-disable no-plusplus */
import { log } from 'console';
import assert from 'assert';

import { ContextItem, ContextResponse } from '../context';
import InteractionHistory, {
  ContextItemEvent,
  PromptInteractionEvent,
} from '../interaction-history';
import { PROMPTS, PromptType, buildPromptDescriptor } from '../prompt';
import { CHARACTERS_PER_TOKEN } from '../message';

type ContextItemWithFile = ContextItem & { file?: string };

export default class ApplyContextService {
  constructor(public readonly interactionHistory: InteractionHistory) {}

  applyContext(context: ContextResponse | undefined, promptPlusContextCharacterLimit: number) {
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

    const { sequenceDiagrams, codeSnippets, codeObjects } = context;

    let characterLimit: number;
    {
      const beforeTokenCount = this.interactionHistory.computeTokenSize();
      this.addSystemPrompts(context);
      const promptTokens = this.interactionHistory.computeTokenSize() - beforeTokenCount;
      characterLimit = promptPlusContextCharacterLimit - promptTokens * CHARACTERS_PER_TOKEN;
    }

    const availableContent = new Array<ContextItemWithFile | undefined>();
    const availableDiagrams = [...sequenceDiagrams];
    const availableCodeSnippets: [string, string][] = Object.keys(codeSnippets).map((key) => [
      key,
      codeSnippets[key],
    ]);
    const availableDataRequests = [...codeObjects];

    const availableItemCount = () =>
      [availableDiagrams.length, availableCodeSnippets.length, availableDataRequests.length].reduce(
        (a, b) => a + b,
        0
      );

    let index = 0;
    while (availableItemCount() > 0) {
      const itemType = index % 5;
      let item: [string, string] | undefined;
      let name: string;
      let content: string | undefined;
      let file: string | undefined;
      switch (itemType) {
        case 0:
          name = PROMPTS[PromptType.SequenceDiagram].prefix;
          content = availableDiagrams.shift();
          if (content || availableDiagrams.length === 0) index += 1;
          break;
        case 1:
        case 2:
        case 3:
          name = PROMPTS[PromptType.CodeSnippet].prefix;
          item = availableCodeSnippets.shift();
          if (item) {
            [file, content] = item;
          } else if (availableCodeSnippets.length === 0) {
            index += 1;
          }
          break;
        case 4:
          name = PROMPTS[PromptType.DataRequest].prefix;
          content = availableDataRequests.shift();
          if (content || availableDataRequests.length === 0) index += 1;
          break;
        default:
          assert(itemType < 5);
          name = 'Invalid';
      }
      if (content) availableContent.push({ name, content, file });
    }

    let charsRemaining = characterLimit;
    log(`Remaining characters before context: ${charsRemaining}`);

    const messages = new Array<ContextItem>();
    const addContextItem = (contextItem: ContextItemWithFile | undefined): boolean => {
      if (!contextItem) return false;

      // TODO: If the first content item is bigger than charsRemaining, no context can be added.
      // This can happen if the "micro" AppMap is still too big.
      if (charsRemaining - contextItem.content.length < 0) return false;

      charsRemaining -= contextItem.content.length;
      this.interactionHistory.addEvent(new ContextItemEvent(contextItem, contextItem.file));
      messages.push(contextItem);
      return true;
    };

    // The sequence diagram may be too big to fit; in that case, continue with code snippets.
    addContextItem(availableContent.shift());
    for (const contextItem of availableContent) {
      if (!addContextItem(contextItem)) break;
    }

    this.interactionHistory.log(`Remaining characters after context: ${charsRemaining}`);
  }

  addSystemPrompts(context: ContextResponse) {
    const { sequenceDiagrams, codeSnippets, codeObjects } = context;

    if (sequenceDiagrams.length > 0)
      this.interactionHistory.addEvent(
        new PromptInteractionEvent(
          PromptType.SequenceDiagram,
          'system',
          buildPromptDescriptor(PromptType.SequenceDiagram)
        )
      );

    if (Object.keys(codeSnippets).length > 0)
      this.interactionHistory.addEvent(
        new PromptInteractionEvent(
          PromptType.CodeSnippet,
          'system',
          buildPromptDescriptor(PromptType.CodeSnippet)
        )
      );

    if (codeObjects.length > 0)
      this.interactionHistory.addEvent(
        new PromptInteractionEvent(
          PromptType.DataRequest,
          'system',
          buildPromptDescriptor(PromptType.DataRequest)
        )
      );
  }
}
