import { log } from 'console';

import { ContextV2 } from '../context';

const VERBOSE = process.env.DEBUG === 'true';

enum ContextItemStatus {
  OK = 'ok',
  SIMILAR_CONTENT = 'similar_content',
  ITEM_UNDEFINED = 'item_undefined',
  ITEM_TOO_BIG = 'item_too_big',
}

export const DEFAULT_SELECTION_FREQUENCY: Map<ContextV2.ContextItemType, number> = Object.entries({
  [ContextV2.ContextItemType.SequenceDiagram]: 1,
  [ContextV2.ContextItemType.CodeSnippet]: 5,
  [ContextV2.ContextItemType.DataRequest]: 2,
  [ContextV2.ContextItemType.HelpDoc]: 1,
}).reduce((map, [key, value]) => {
  map.set(key as ContextV2.ContextItemType, value);
  return map;
}, new Map<ContextV2.ContextItemType, number>());

export default function applyContext(
  context: ContextV2.ContextItem[],
  characterLimit: number,
  maxContentLength: number = characterLimit / 5,
  selectionFrequency: Map<ContextV2.ContextItemType, number> = DEFAULT_SELECTION_FREQUENCY,
  verbose = VERBOSE
): ContextV2.ContextItem[] {
  const itemTypeByIndex = Array<ContextV2.ContextItemType>();
  for (const [itemType, frequency] of selectionFrequency) {
    for (let i = 0; i < frequency; i += 1) {
      itemTypeByIndex.push(itemType);
    }
  }

  const availableContext: Array<ContextV2.ContextItem | undefined> = [...context];
  const roundSize = itemTypeByIndex.length;

  // Select items in a round-robin fashion, to ensure a mix of content types. Heuristically, we
  // want to see one sequence diagram, N code snippets, and M data requests. If we run out of
  // one type of content type, we'll continue adding the other types.
  let index = 0;
  const selectedContext = new Array<ContextV2.ContextItem>();
  let availableItemCount = availableContext.length;
  while (availableItemCount > 0) {
    const itemType = index % roundSize;
    index += 1;

    let contextItem: ContextV2.ContextItem | undefined;
    const itemIndex = availableContext.findIndex(
      (item) => item?.type === itemTypeByIndex[itemType]
    );
    if (itemIndex !== -1) {
      availableItemCount -= 1;
      contextItem = availableContext[itemIndex];
      availableContext[itemIndex] = undefined;
    }

    if (contextItem) selectedContext.push(contextItem);
  }

  let charsRemaining = characterLimit;
  log(`Remaining characters before context: ${charsRemaining}`);
  const appliedContext = new Array<ContextV2.ContextItem>();

  const itemDescription = (contextItem: ContextV2.ContextItem): string =>
    [contextItem.type, contextItem.location].filter(Boolean).join(' ');

  const addContextItem = (contextItem: ContextV2.ContextItem): ContextItemStatus => {
    // Don't consume too much of the character limit on a single item.
    if (contextItem.content.length > maxContentLength) {
      if (verbose) {
        log(
          `Skipping context item ${itemDescription(contextItem)} due to size. ${
            contextItem.content.length
          } > ${maxContentLength}`
        );
      }
      return ContextItemStatus.ITEM_TOO_BIG;
    }

    if (
      contextItem.type === ContextV2.ContextItemType.SequenceDiagram &&
      appliedContext[appliedContext.length - 1]?.type === ContextV2.ContextItemType.SequenceDiagram
    ) {
      if (verbose)
        log(
          `Skipping context item ${itemDescription(
            contextItem
          )} because the previous context item is also a sequence diagram.`
        );
      return ContextItemStatus.SIMILAR_CONTENT;
    }

    if (verbose)
      log(`Adding context item ${itemDescription(contextItem)} (${contextItem.content.length})`);

    charsRemaining -= contextItem.content.length;
    appliedContext.push(contextItem);

    return ContextItemStatus.OK;
  };

  let hasSequenceDiagramBeenAdded = false;
  const onlySequenceDiagramsRemaining = (i: number) =>
    selectedContext
      .slice(i)
      .every((item) => item.type === ContextV2.ContextItemType.SequenceDiagram);

  for (let i = 0; i < selectedContext.length; i += 1) {
    const contextItem = selectedContext[i];
    const status = addContextItem(contextItem);
    if (
      status === ContextItemStatus.OK &&
      contextItem.type === ContextV2.ContextItemType.SequenceDiagram
    ) {
      hasSequenceDiagramBeenAdded = true;
    }

    if (verbose) log(`Context item ${itemDescription(contextItem)} status: ${status}`);

    const contextItemsRemaining = selectedContext.length - i - 1;
    if (
      hasSequenceDiagramBeenAdded &&
      contextItemsRemaining > 1 &&
      onlySequenceDiagramsRemaining(i + 1)
    ) {
      log(
        `Only sequence diagrams remain in the context, and at least one sequence diagram has already been added. No further context will be added.`
      );
      break;
    }

    if (charsRemaining <= 0) {
      log(`Characterlimit reached.`);
      break;
    }
  }

  log(
    `Added ${
      characterLimit - charsRemaining
    } characters out of a requested limit of ${characterLimit}.`
  );

  return appliedContext;
}
