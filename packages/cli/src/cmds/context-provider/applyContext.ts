import { verbose } from '../../utils';
import { ContextResult, ContextValue } from './context-provider';
import { log } from 'console';

enum ContextItemStatus {
  OK = 'ok',
  SIMILAR_CONTENT = 'similar_content',
  ITEM_UNDEFINED = 'item_undefined',
  ITEM_TOO_BIG = 'item_too_big',
}

export default function applyContext(
  context: ContextResult,
  characterLimit: number
): ContextResult {
  // Available context, sampled in a round-robin fashion.
  const availableContext = new Array<ContextValue>();

  const availableDiagrams = [...context.filter((item) => item.type === 'sequenceDiagram')];
  const availableCodeSnippets = [...context.filter((item) => item.type === 'codeSnippet')];
  const availableDataRequests = [...context.filter((item) => item.type === 'dataRequest')];

  const availableItemCount = () =>
    [availableDiagrams.length, availableCodeSnippets.length, availableDataRequests.length].reduce(
      (a, b) => a + b,
      0
    );

  // Select items in a round-robin fashion, to ensure a mix of content types. Heuristically, we
  // want to see one sequence diagram, N code snippets, and M data requests. If we run out of
  // one type of content type, we'll continue adding the other types.
  const numDiagrams = 1;
  const numSnippets = 7;
  const numDataRequests = 2;
  const roundSize = numDiagrams + numSnippets + numDataRequests;
  let index = 0;
  while (availableItemCount() > 0) {
    const itemType = index % roundSize;
    index += 1;

    let contextItem: ContextValue | undefined;
    const selectDiagram = () => {
      contextItem = availableDiagrams.shift()!;
    };

    const selectCodeSnippet = () => {
      contextItem = availableCodeSnippets.shift()!;
    };

    const selectDataRequest = () => {
      contextItem = availableDataRequests.shift()!;
    };

    if (itemType === 0) {
      selectDiagram();
    } else if (itemType >= numDiagrams && itemType < numDiagrams + numSnippets) {
      selectCodeSnippet();
    } else {
      selectDataRequest();
    }

    if (contextItem) availableContext.push(contextItem);
  }

  let charsRemaining = characterLimit;
  log(`Remaining characters before context: ${charsRemaining}`);

  const itemDescription = (contextItem: ContextValue): string =>
    [contextItem.type, contextItem.id].filter(Boolean).join(' ');

  const result = new Array<ContextValue>();
  const addContextItem = (contextItem: ContextValue): ContextItemStatus => {
    // Don't consume too much of the character limit on a single item.
    if (contextItem.content.length > characterLimit / 5) {
      if (verbose())
        log(
          `Skipping context item ${itemDescription(contextItem)} due to size. ${
            contextItem.content.length
          } > ${characterLimit / 3}`
        );
      return ContextItemStatus.ITEM_TOO_BIG;
    }

    if (
      contextItem.type === 'sequenceDiagram' &&
      result[result.length - 1]?.type === 'sequenceDiagram'
    ) {
      if (verbose())
        log(
          `Skipping context item ${itemDescription(
            contextItem
          )} because the previous context item is also a sequence diagram.`
        );
      return ContextItemStatus.SIMILAR_CONTENT;
    }

    if (verbose())
      log(`Adding context item ${itemDescription(contextItem)} (${contextItem.content.length})`);
    charsRemaining -= contextItem.content.length;
    result.push(contextItem);
    if (verbose()) log(`Remaining characters: ${charsRemaining}`);

    return ContextItemStatus.OK;
  };

  let hasSequenceDiagramBeenAdded = false;
  const onlySequenceDiagramsRemaining = (i: number) =>
    availableContext.slice(i).every((item) => item.type === 'sequenceDiagram');

  for (let i = 0; i < availableContext.length; i++) {
    const contextItem = availableContext[i];
    const status = addContextItem(contextItem);
    if (status === ContextItemStatus.OK && contextItem.type === 'sequenceDiagram') {
      hasSequenceDiagramBeenAdded = true;
    }

    if (verbose()) log(`Context item ${itemDescription(contextItem)} status: ${status}`);

    if (hasSequenceDiagramBeenAdded && onlySequenceDiagramsRemaining(i)) {
      log(
        `Only sequence diagrams remain in the context, and at least one sequence diagram has already been added. No further context will be added.`
      );
      break;
    }

    if (charsRemaining < 0) {
      log(`Characterlimit reached.`);
      break;
    }
  }

  log(
    `Added ${
      characterLimit - charsRemaining
    } characters out of a requested limit of ${characterLimit}.`
  );

  return result;
}
