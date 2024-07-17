import InteractionHistory from '../../src/interaction-history';
import { Chunk } from '../../src/lib/filter';
import MermaidFilter from '../../src/lib/mermaid-filter';
import trimFences from '../../src/lib/trim-fences';
import MermaidFixerService from '../../src/services/mermaid-fixer-service';

describe('MermaidFilter', () => {
  let history: InteractionHistory;
  let repairDiagram: jest.Mock;
  let mermaidFixerService: MermaidFixerService;
  let filter: MermaidFilter;

  beforeEach(() => {
    history = new InteractionHistory();
    repairDiagram = jest.fn();
    mermaidFixerService = {
      repairDiagram,
    } as unknown as MermaidFixerService;
    filter = new MermaidFilter(history, mermaidFixerService);
  });

  const collectChunks = async (
    result: AsyncIterable<Chunk>,
    list: string[] = new Array<string>()
  ) => {
    for await (const chunk of result) {
      list.push(chunk.content);
    }
    return list;
  };

  const transformContent = async (content: string, output: string[] = new Array<string>()) => {
    while (content.length > 0) {
      const chunk = content.slice(0, 5);
      content = content.slice(5);
      await collectChunks(filter.transform(chunk), output);
    }
    await collectChunks(filter.end(), output);

    return output;
  };

  it('should process a single line', async () => {
    const output = await collectChunks(filter.transform('graph TD'));
    await collectChunks(filter.end(), output);

    expect(output).toEqual(['graph TD']);
  });

  it('should process mixed content including a valid diagram', async () => {
    let content = 'a diagram\n```mermaid\ngraph TD\n  A1 --> B1\n````';
    const output = await transformContent(content);
    expect(output).toEqual(['a diagram\n', '\n```mermaid\ngraph TD\n  A1 --> B1\n```\n']);
  });

  it('yields an unclosed diagram', async () => {
    let content = '```mermaid\ngraph TD\n  A2 --> B2\n';
    const output = await transformContent(content);
    expect(output).toEqual(['\n```mermaid\ngraph TD\n  A2 --> B2\n```\n']);
  });

  it('handles prefix and postfix markdown', async () => {
    let content =
      'prefix content\na diagram\n```mermaid\ngraph TD\n  A3 --> B3\n```\npostfix content\n';
    const output = await transformContent(content);
    expect(output).toEqual([
      'prefix content\n',
      'a diagram\n',
      '\n```mermaid\ngraph TD\n  A3 --> B3\n```\n',
      'postfix content\n',
      '',
    ]);
  });

  it('retains whitespace in markdown', async () => {
    let content = 'prefix content\n\npostfix content';
    const output = await transformContent(content);
    expect(output).toEqual(['prefix content\n', '\n', 'postfix content']);
  });

  describe('when fed an invalid diagram', () => {
    const validDiagram = `\`\`\`mermaid
graph TD;
  A-->B;
  A-->C;
  B-->D;
  C-->D;
\`\`\`
`;

    const invalidDiagram = `\`\`\`mermaid
graph TD;
  A--&gt;B;
  A--&gt;C;
  B-->D;
  C--D;
\`\`\`
`;

    describe('when the diagram is not repairable', () => {
      it('should pass the diagram through', async () => {
        repairDiagram.mockResolvedValue(trimFences(invalidDiagram));
        const output = await transformContent(invalidDiagram);
        expect(output.join('')).toEqual(`
\`\`\`text
${trimFences(invalidDiagram)}
\`\`\`
`);
      });
    });

    describe('when the diagram is repairable', () => {
      it('should repair the diagram', async () => {
        repairDiagram.mockResolvedValue(trimFences(validDiagram));
        const output = await transformContent(invalidDiagram);
        expect(output.join('')).toEqual(`
\`\`\`mermaid
${trimFences(validDiagram)}
\`\`\`
`);
      });
    });
  });
});
