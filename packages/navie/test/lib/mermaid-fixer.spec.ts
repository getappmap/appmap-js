import InteractionHistory from '../../src/interaction-history';
import MermaidFixer from '../../src/lib/mermaid-fixer';
import CompletionService, { Completion, Usage } from '../../src/services/completion-service';

describe('MermaidFixer', () => {
  let mermaidFixer: MermaidFixer;
  let history: InteractionHistory;
  let completion: CompletionService;
  let complete: jest.Mock;

  beforeEach(() => {
    history = new InteractionHistory();
    complete = jest.fn();
    completion = {
      complete,
    } as unknown as CompletionService;
    mermaidFixer = new MermaidFixer(history, completion);
  });

  it('should repair a diagram', async () => {
    const diagram = 'graph TD\n  A --> B';
    const error = 'Error: Something went wrong';
    const repairedDiagram = 'graph TD\n  A --> B';

    const completer = async function* () {
      yield `graph TD\n  A --> B`;
    };

    complete.mockImplementation(completer);

    const result = await mermaidFixer.repairDiagram(diagram, error);

    expect(result).toEqual(repairedDiagram);
  });
});
