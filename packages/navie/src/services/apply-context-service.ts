import { log } from 'console';
import { ContextResponse, ContextItem } from '../interaction-state';
import InteractionHistory, { ContextItemEvent } from '../interaction-history';

export default class ApplyContextService {
  constructor(public readonly interactionHistory: InteractionHistory) {}

  applyContext(context: ContextResponse, characterLimit: number) {
    const { sequenceDiagrams, codeSnippets, codeObjects } = context;

    const diagramsText = sequenceDiagrams.map((diagram) => `Sequence diagram: ${diagram}`);
    const codeSnippetsText = Object.entries(codeSnippets).map(
      (snippet) => `${snippet[0]}: ${snippet[1]}`
    );
    for (const codeObject of codeObjects) {
      codeSnippetsText.push(codeObject);
    }

    const contextItems = new Array<ContextItem | undefined>();
    const addDiagramItem = () => {
      const diagram = diagramsText.shift();
      if (!diagram) return;

      contextItems.push({
        name: 'sequence-diagram',
        content: diagram,
      });
    };

    const addCodeSnippetItem = () => {
      const codeSnippet = codeSnippetsText.shift();
      if (!codeSnippet) return;

      contextItems.push({
        name: 'code-snippet',
        content: codeSnippet,
      });
    };

    const isContextRemaining = () => diagramsText.length > 0 || codeSnippetsText.length > 0;
    while (isContextRemaining()) {
      addDiagramItem();
      addCodeSnippetItem();
      addCodeSnippetItem();
      addCodeSnippetItem();
      addCodeSnippetItem();
      addCodeSnippetItem();
    }

    let charsRemaining = characterLimit;
    log(`Remaining characters before context: ${charsRemaining}`);

    const messages = new Array<ContextItem>();
    const addContextItem = (contextItem: ContextItem | undefined): boolean | undefined => {
      if (!contextItem) return undefined;

      // TODO: If the first content item is bigger than charsRemaining, no context can be added.
      // This can happen if the "micro" AppMap is still too big.
      if (charsRemaining - contextItem.content.length < 0) return false;

      charsRemaining -= contextItem.content.length;
      this.interactionHistory.addEvent(new ContextItemEvent(contextItem));
      messages.push(contextItem);
      return true;
    };

    // The sequence diagram may be too big to fit; in that case, continue with code snippets.
    addContextItem(contextItems.shift());
    for (const contextItem of contextItems) {
      if (!addContextItem(contextItem)) break;
    }

    this.interactionHistory.log(`Remaining characters after context: ${charsRemaining}`);
  }
}
