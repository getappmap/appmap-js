import InteractionHistory from '../../src/interaction-history';
import CompletionService from '../../src/services/completion-service';
import MermaidFixerService from '../../src/services/mermaid-fixer-service';

describe('MermaidFixerService', () => {
  let mermaidFixer: MermaidFixerService;
  let history: InteractionHistory;
  let completion: CompletionService;
  let complete: jest.Mock;

  beforeEach(() => {
    history = new InteractionHistory();
    complete = jest.fn();
    completion = {
      complete,
    } as unknown as CompletionService;
    mermaidFixer = new MermaidFixerService(history, completion);
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
