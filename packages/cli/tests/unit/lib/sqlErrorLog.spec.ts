import * as fs from 'fs/promises';

import sqlErrorLog from '../../../src/lib/sqlErrorLog';

jest.mock('fs/promises');
interface MockFd extends fs.FileHandle {
  write: jest.Mock;
  close: jest.Mock;
}

describe('sqlErrorLog', () => {
  const parseError = {
    sql: '',
    name: 'ParseError',
    message: 'failed parsing SQL',
    toString() {
      return this.message;
    },
  };

  beforeEach(() => {
    const mockfd: Partial<MockFd> = {
      write: jest.fn().mockResolvedValue({}),
      close: jest.fn().mockResolvedValue(undefined),
    };

    jest.mocked(fs.open).mockResolvedValue(mockfd as fs.FileHandle);
    console.warn = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.APPMAP_SQL_WARNING;
  });

  it('should write error to file when APPMAP_SQL_WARNING is set', async () => {
    process.env.APPMAP_SQL_WARNING = '1';
    parseError.sql = 'select from TABLE1';
    sqlErrorLog(parseError);

    expect(fs.open).toHaveBeenCalledWith('sql_warning.txt', 'w');
    expect((await (fs.open as jest.Mock).mock.results[0].value).write).toHaveBeenCalledWith(
      expect.stringContaining(parseError.message)
    );
  });

  it('should not attempt to write to file when APPMAP_SQL_WARNING is not set', async () => {
    sqlErrorLog(parseError);
    expect(fs.open).not.toHaveBeenCalled();
  });

  it('should log warning to console if file operations fail', async () => {
    process.env.APPMAP_SQL_WARNING = '1';
    jest.mocked(fs.open).mockImplementationOnce(() => {
      throw new Error('Mocked file open error');
    });

    parseError.sql = 'select from TABLE2';
    sqlErrorLog(parseError);

    expect(fs.open).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(expect.any(Error));
    expect(console.warn).toHaveBeenCalledWith(`SQL Error: ${parseError.message}\n`);
  });
});
