import InteractionHistory from '../../src/interaction-history';
import { CommandRequest } from '../../src/command';
import UpdateCommand from '../../src/commands/update-command';
import ComputeUpdateService, { Update } from '../../src/services/compute-update-service';
import { UserOptions } from '../../src/lib/parse-options';

jest.mock('../../src/services/compute-update-service');

describe('UpdateCommand', () => {
  let command: UpdateCommand;
  let history: InteractionHistory;
  let computeUpdateService: ComputeUpdateService;
  let userOptions: UserOptions;

  beforeEach(() => {
    history = new InteractionHistory();
    userOptions = new UserOptions(new Map());
    computeUpdateService = new ComputeUpdateService(history, {} as any);
    command = new UpdateCommand(history, computeUpdateService);
  });

  afterEach(() => jest.resetAllMocks());

  const collectUpdates = async (result: AsyncIterable<string>) => {
    const updates = new Array<string>();
    for await (const update of result) updates.push(update);
    return updates;
  };

  test('logs and yields nothing when question is missing', async () => {
    const request: CommandRequest = {
      question: '',
      codeSelection: 'some code selection',
      userOptions,
    };
    history.log = jest.fn();
    const result = command.execute(request);
    const updates = await collectUpdates(result);

    expect(history.log).toHaveBeenCalledWith(
      `No question found in request: ${JSON.stringify(request)}`
    );
    expect(updates.length).toBe(0);
  });

  test('logs and yields nothing when code selection is missing', async () => {
    const request: CommandRequest = {
      question: 'What is the update?',
      codeSelection: '',
      userOptions,
    };
    history.log = jest.fn();
    const result = command.execute(request);
    const updates = await collectUpdates(result);

    expect(history.log).toHaveBeenCalledWith(
      `No code selection found in request: ${JSON.stringify(request)}`
    );
    expect(updates.length).toBe(0);
  });

  test('yields nothing when computeUpdate returns undefined', async () => {
    const request: CommandRequest = {
      question: 'What is the update?',
      codeSelection: 'some code selection',
      userOptions,
    };
    computeUpdateService.computeUpdate = jest.fn().mockResolvedValue(undefined);

    const result = command.execute(request);
    const updates = await collectUpdates(result);

    expect(computeUpdateService.computeUpdate).toHaveBeenCalledWith(
      'some code selection',
      'What is the update?'
    );
    expect(updates.length).toBe(0);
  });

  test('yields the expected update JSON when computeUpdate returns an update', async () => {
    const request: CommandRequest = {
      question: 'What is the update?',
      codeSelection: 'some code selection',
      userOptions,
    };
    const update: Update = { original: 'some code selection', modified: 'What is the update?' };
    computeUpdateService.computeUpdate = jest.fn().mockResolvedValue(update);

    const result = command.execute(request);
    const updates = await collectUpdates(result);

    expect(computeUpdateService.computeUpdate).toHaveBeenCalledWith(
      'some code selection',
      'What is the update?'
    );
    expect(updates.length).toBe(1);
    expect(updates[0]).toBe(JSON.stringify(update, null, 2));
  });
});
