/* eslint-disable no-cond-assign */
import assert from 'assert';
import { isNativeError } from 'node:util/types';

import mermaid from './mermaid';

import InteractionHistory from '../interaction-history';
import MermaidFixerService from '../services/mermaid-fixer-service';

export default class MermaidFilter {
  private diagram: string[] | undefined;
  private buffer = '';

  constructor(
    private readonly history: InteractionHistory,
    private readonly mermaidFixer: MermaidFixerService
  ) {}

  get inDiagram() {
    return this.diagram !== undefined;
  }

  async *transform(stream: AsyncIterable<string>): AsyncIterable<string> {
    for await (const chunk of stream) yield* this.processChunk(chunk);
    yield* this.end();
  }

  async *processChunk(chunk: string): AsyncIterable<string> {
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

  async *end(): AsyncIterable<string> {
    if (this.inDiagram) yield* this.onDiagram();
    else yield this.buffer;
    this.buffer = '';
  }

  private async *processLine(line: string): AsyncIterable<string> {
    if (!this.inDiagram) {
      const startMatch = line.trim() === '```mermaid';
      if (startMatch) {
        this.diagram = [];
      } else {
        yield line;
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

  async *onDiagram(): AsyncIterable<string> {
    const diagramContent = (this.diagram || []).join('');
    this.diagram = undefined;

    // Ensure that the diagram content parses correctly.
    try {
      mermaid.parse(diagramContent);
      this.history.log(`[mermaid-filter] Yielding diagram:\n${diagramContent}`);
      const content = ['', '```mermaid', diagramContent.trim(), '```', ''].join('\n');
      yield content;
    } catch (e) {
      const error = isNativeError(e) ? e.message : String(e);
      this.history.log(`[mermaid-filter] Diagram is not valid: ${error}`);
      yield* this.repairDiagram(diagramContent, error);
    }
  }

  async *repairDiagram(diagram: string, error: string): AsyncIterable<string> {
    // yield a message to the user that the diagram is not valid
    yield '*Note: The model generated an invalid diagram. Trying to repair, please be patient...*\n\n';
    const repairedDiagram = await this.mermaidFixer.repairDiagram(diagram, error);

    // Check if the repaired diagram is valid.
    try {
      mermaid.parse(repairedDiagram);
      this.history.log(`[mermaid-filter] Diagram successfully repaired.`);

      const content = ['', '```mermaid', repairedDiagram, '```', ''].join('\n');
      yield content;
    } catch (e) {
      const error = isNativeError(e) ? e.message : String(e);
      this.history.log(`[mermaid-filter] Diagram is still not valid: ${error}`);
      this.history.log(`[mermaid-filter] Returning repaired diagram as plain text block.`);
      // If the repaired diagram is still invalid, return the repaired diagram, but as a plain text
      // block so that the frontend won't try and render it.
      const content = ['', '```text', repairedDiagram, '```', ''].join('\n');
      yield content;
    }
  }
}
