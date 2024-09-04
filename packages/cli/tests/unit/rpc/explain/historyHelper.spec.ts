import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { initializeHistory } from '../../../../src/rpc/explain/navie/historyHelper';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  mkdirSync: jest.fn(),
  existsSync: jest.fn(),
}));

describe('historyHelper', () => {
  beforeEach(() => jest.resetAllMocks());

  it('creates history directory if it does not exist', () => {
    const historyDir = join(homedir(), '.appmap', 'navie', 'history');
    (existsSync as jest.Mock).mockReturnValue(false);

    initializeHistory();

    expect(mkdirSync).toHaveBeenCalledWith(historyDir, { recursive: true });
  });

  it('does not create history directory if it already exists', () => {
    (existsSync as jest.Mock).mockReturnValue(true);

    initializeHistory();

    expect(mkdirSync).not.toHaveBeenCalled();
  });
});
