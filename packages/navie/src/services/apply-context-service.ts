import { error, log } from 'console';

import { ContextV2 } from '../context';
import InteractionHistory, {
  ContextItemEvent,
  PromptInteractionEvent,
} from '../interaction-history';
import { PromptType, buildPromptDescriptor } from '../prompt';
import { HelpDoc, HelpResponse } from '../help';

type ContextItemWithFile = { type: PromptType; content: string; file?: string };

export default class ApplyContextService {
  constructor(public readonly interactionHistory: InteractionHistory) {}

  applyContext(
    context: ContextV2.ContextResponse | undefined,
    help: HelpResponse,
    characterLimit: number
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

    const sequenceDiagrams = context.filter(
      (item) => item.type === ContextV2.ContextItemType.SequenceDiagram
    );
    const codeSnippets = context.filter(
      (item) => item.type === ContextV2.ContextItemType.CodeSnippet
    );
    const dataRequests = context.filter(
      (item) => item.type === ContextV2.ContextItemType.DataRequest
    );

    const availableContent = new Array<ContextItemWithFile | undefined>();
    const availableDiagrams = [...sequenceDiagrams];
    const availableCodeSnippets = [...codeSnippets];
    const availableDataRequests = [...dataRequests];
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

      let item: ContextV2.ContextItem | undefined;
      let helpItem: HelpDoc | undefined;

      const selectDiagram = () => {
        item = availableDiagrams.shift();
      };

      const selectCodeSnippet = () => {
        item = availableCodeSnippets.shift();
      };

      const selectDataRequest = () => {
        item = availableDataRequests.shift();
      };

      const selectHelp = () => {
        helpItem = availableHelp.shift();
      };

      if (itemType === 0) {
        selectDiagram();
      } else if (itemType >= numDiagrams && itemType < numDiagrams + numSnippets) {
        selectCodeSnippet();
      } else if (
        itemType >= numDiagrams + numSnippets &&
        itemType < numDiagrams + numSnippets + numDataRequests
      ) {
        selectDataRequest();
      } else {
        selectHelp();
      }

      if (item) {
        let promptType: PromptType | undefined;
        // eslint-disable-next-line default-case
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
        }
        if (promptType)
          availableContent.push({ type: promptType, content: item.content, file: item.location });
      } else if (helpItem) {
        availableContent.push({
          type: PromptType.HelpDoc,
          content: helpItem.content,
          file: helpItem.filePath,
        });
      }
    }

    let charsRemaining = characterLimit;
    log(`Remaining characters before context: ${charsRemaining}`);

    const addContextItem = (contextItem: ContextItemWithFile | undefined): boolean => {
      if (!contextItem) return false;

      // TODO: If the first content item is bigger than charsRemaining, no context can be added.
      // This can happen if the "micro" AppMap is still too big.
      if (charsRemaining - contextItem.content.length < 0) return false;

      charsRemaining -= contextItem.content.length;
      this.interactionHistory.addEvent(
        new ContextItemEvent(contextItem.type, contextItem.content, contextItem.file)
      );
      return true;
    };

    // The sequence diagram may be too big to fit; in that case, continue with code snippets.
    addContextItem(availableContent.shift());
    for (const contextItem of availableContent) {
      if (!addContextItem(contextItem)) break;
    }

    this.interactionHistory.log(`Remaining characters after context: ${charsRemaining}`);
  }

  addSystemPrompts(context: ContextV2.ContextResponse, help: HelpResponse) {
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
