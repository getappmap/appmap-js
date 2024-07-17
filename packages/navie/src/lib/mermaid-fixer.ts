import trimFences from './trim-fences';
import Message from '../message';
import InteractionHistory from '../interaction-history';
import CompletionService from '../services/completion-service';

export default class MermaidFixer {
  constructor(
    private readonly history: InteractionHistory,
    private readonly completion: CompletionService
  ) {}

  async repairDiagram(diagram: string, error: string): Promise<string> {
    this.history.log(`[mermaid-fixer] Attempting to repair diagram.`);

    const systemPrompt = `**Mermaid Diagram Repair**

There is an error present in the diagram. Please make the necessary corrections to the diagram,
and return the corrected diagram.

The diagram output format should be in the form of a Mermaid diagram, enclosed in a code block.

<example>
\`\`\`mermaid
    the diagram content
\`\`\`
</example>

<error>
${error}
</error>`;

    const messages: Message[] = [
      {
        content: systemPrompt,
        role: 'system',
      },
      {
        content: diagram,
        role: 'user',
      },
    ];
    const response = this.completion.complete(messages);
    const tokens = Array<string>();
    for await (const token of response) {
      tokens.push(token);
    }
    const repairedContent = tokens.join('');
    const diagramContent = trimFences(repairedContent);
    this.history.log(`[mermaid-fixer] Diagram repair attempt complete.`);
    this.history.log(`[mermaid-fixer] Repaired diagram:\n${diagramContent}`);

    return diagramContent;
  }
}
