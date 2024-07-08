/* eslint-disable no-cond-assign */
import assert from 'assert';

import Filter, { Chunk } from './filter';
import MermaidValidator from './mermaid-validator';

import InteractionHistory from '../interaction-history';
import MermaidFixerService from '../services/mermaid-fixer-service';

export default class MermaidFilter implements Filter {
  private diagram: string[] | undefined;
  private buffer = '';

  constructor(
    private readonly history: InteractionHistory,
    private readonly mermaidFixer: MermaidFixerService
  ) {}

  get inDiagram() {
    return this.diagram !== undefined;
  }

  async *transform(chunk: string): AsyncIterable<Chunk> {
    // Lines are delineated by '\n'.
    // When a new chunk is received, append the chunk to the buffer.
    // Extract any complete lines from the buffer and process them.

    this.buffer += chunk;

    while (true) {
      const newlineIndex = this.buffer.indexOf('\n');
      if (newlineIndex === -1) break;

      const nextLine = this.buffer.slice(0, newlineIndex + 1);
      this.buffer = this.buffer.slice(newlineIndex + 1);
      yield* this.processLine(nextLine);
    }
  }

  async *end(): AsyncIterable<Chunk> {
    if (this.inDiagram) yield* this.onDiagram();
    else yield { type: 'markdown', content: this.buffer };
    this.buffer = '';
  }

  private async *processLine(line: string): AsyncIterable<Chunk> {
    this.history.log(`[mermaid-filter] ${line}`);
    if (!this.inDiagram) {
      const startMatch = line.trim() === '```mermaid';
      if (startMatch) {
        this.diagram = [];
      } else {
        yield { type: 'markdown', content: line };
      }
    } else {
      const endMatch = line.trim() === '```';
      if (endMatch) {
        yield* this.onDiagram();
      } else {
        assert(this.diagram);
        this.diagram.push(line);
      }
    }
  }

  async *onDiagram(): AsyncIterable<Chunk> {
    const diagramContent = (this.diagram || []).join('');
    this.diagram = undefined;

    // Ensure that the diagram content parses correctly.
    const validator = new MermaidValidator(diagramContent);
    const validation = await validator.validate();

    // TODO: This is a temporary fix to ignore errors that are not related to the diagram
    // vN.sanitize error is appearing in Mermaid v9
    const ignoreError = (error?: string) => error?.includes('vN.sanitize');

    if (validation.valid || ignoreError(validation.error)) {
      if (ignoreError(validation.error))
        this.history.log(`[mermaid-filter] Ignoring error: ${validation.error || '(none)'}`);

      this.history.log(`[mermaid-filter] Yielding diagram:\n${diagramContent}`);
      const content = ['', '```mermaid', diagramContent.trim(), '```', ''].join('\n');
      yield { type: 'diagram', content };
    } else {
      this.history.log(`[mermaid-filter] Generated diagram is not valid`);

      // eslint-disable-next-line no-lonely-if
      if (validation.error && !ignoreError(validation.error)) {
        this.history.log(`[mermaid-filter] Error: ${validation.error}`);
        yield* this.repairDiagram(diagramContent, validation.error);
      } else {
        yield {
          type: 'diagram',
          content: ['', '```text', diagramContent.trim(), '```', ''].join('\n'),
        };
      }
    }
  }

  async *repairDiagram(diagram: string, error: string): AsyncIterable<Chunk> {
    const repairedDiagram = await this.mermaidFixer.repairDiagram(diagram, error);

    // Check if the repaired diagram is valid.
    const validator = new MermaidValidator(repairedDiagram);
    const validation = await validator.validate();
    if (validation.valid) {
      this.history.log(`[mermaid-filter] Diagram successfully repaired.`);

      const content = ['', '```mermaid', repairedDiagram, '```', ''].join('\n');
      yield { type: 'diagram', content };
    } else {
      this.history.log(
        `[mermaid-filter] Diagram repair unsuccessful. Returning repaired content as text.`
      );

      // If the repaired diagram is still invalid, return the repaired diagram, but as a plain text
      // block so that the frontend won't try and render it.
      const content = ['', '```text', repairedDiagram, '```', ''].join('\n');
      yield { type: 'diagram', content };
    }
  }
}
