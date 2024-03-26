import { log } from 'console';
import assert from 'assert';

import { ContextItem, ContextResponse } from '../context';
import InteractionHistory, {
  ContextItemEvent,
  PromptInteractionEvent,
} from '../interaction-history';
import { PROMPTS, PromptType, buildPromptDescriptor } from '../prompt';
import { HelpResponse } from '../help';

type ContextItemWithFile = ContextItem & { file?: string };

export default class ApplyContextService {
  constructor(public readonly interactionHistory: InteractionHistory) {}

  applyContext(context: ContextResponse | undefined, help: HelpResponse, characterLimit: number) {
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

    const availableContent = new Array<ContextItemWithFile | undefined>();
    const availableDiagrams = [...sequenceDiagrams];
    const availableCodeSnippets: [string, string][] = Object.keys(codeSnippets).map((key) => [
      key,
      codeSnippets[key],
    ]);
    const availableDataRequests = [...codeObjects];
    const availableHelp = [...help];

    const availableItemCount = () =>
      [
        availableDiagrams.length,
        availableCodeSnippets.length,
        availableDataRequests.length,
        availableHelp.length,
      ].reduce((a, b) => a + b, 0);

    // Select items in a round-robin fashion, to ensure a mix of content types. Heuristically, we
    // want to see one sequence diagram, N code snippets, and M data requests. If we run out of
    // one type of content type, we'll continue adding the other types.
    const numDiagrams = 1;
    const numSnippets = 7;
    const numDataRequests = 2;
    const numHelp = 1;
    const roundSize = numDiagrams + numSnippets + numDataRequests + numHelp;
    let index = 0;
    while (availableItemCount() > 0) {
      const itemType = index % roundSize;
      index += 1;

      let item: [string, string] | undefined;
      let name: string | undefined;
      let content: string | undefined;
      let file: string | undefined;

      const selectDiagram = (): boolean => {
        if (availableDiagrams.length === 0) return false;

        name = PROMPTS[PromptType.SequenceDiagram].prefix;
        content = availableDiagrams.shift();
        return true;
      };

      const selectCodeSnippet = (): boolean => {
        if (availableCodeSnippets.length === 0) return false;

        name = PROMPTS[PromptType.CodeSnippet].prefix;
        item = availableCodeSnippets.shift();
        assert(item);
        [file, content] = item;
        return true;
      };

      const selectDataRequest = (): boolean => {
        if (availableDataRequests.length === 0) return false;

        name = PROMPTS[PromptType.DataRequest].prefix;
        content = availableDataRequests.shift();
        return true;
      };

      const selectHelp = (): boolean => {
        if (availableHelp.length === 0) return false;

        const helpItem = availableHelp.shift();
        if (!helpItem) return false;

        name = PROMPTS[PromptType.HelpDoc].prefix;
        [file, content] = [helpItem.filePath, helpItem.content];
        return true;
      };

      let selectionMade: boolean;
      if (itemType === 0) {
        selectionMade = selectDiagram();
      } else if (itemType >= numDiagrams && itemType < numDiagrams + numSnippets) {
        selectionMade = selectCodeSnippet();
      } else if (
        itemType >= numDiagrams + numSnippets &&
        itemType < numDiagrams + numSnippets + numDataRequests
      ) {
        selectionMade = selectDataRequest();
      } else {
        selectionMade = selectHelp();
      }

      if (selectionMade) {
        assert(name && content);
        availableContent.push({ name, content, file });
      }
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
      this.interactionHistory.addEvent(
        new ContextItemEvent(
          { name: contextItem.name, content: contextItem.content },
          contextItem.file
        )
      );
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

  addSystemPrompts(context: ContextResponse, help: HelpResponse) {
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
