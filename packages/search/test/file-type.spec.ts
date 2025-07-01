import { isBinaryFile as checkBinaryFile } from 'isbinaryfile';
import { getFileExtensions, isBinaryFile } from '../src/file-type';

jest.mock('isbinaryfile');
const mockedCheckBinaryFile = jest.mocked(checkBinaryFile);

describe('getFileExtensions', () => {
  it('returns empty array for files without extensions', () => {
    expect(getFileExtensions('filename')).toEqual([]);
    expect(getFileExtensions('/path/to/filename')).toEqual([]);
  });

  it('returns single extension for simple files', () => {
    expect(getFileExtensions('file.txt')).toEqual(['.txt']);
    expect(getFileExtensions('/path/to/file.js')).toEqual(['.js']);
  });

  it('returns multiple extensions for compound extensions', () => {
    expect(getFileExtensions('file.tar.gz')).toEqual(['.tar.gz', '.gz']);
    expect(getFileExtensions('/path/to/file.min.js')).toEqual(['.min.js', '.js']);
  });

  it('handles paths with dots correctly', () => {
    expect(getFileExtensions('/path.to/file.txt')).toEqual(['.txt']);
    expect(getFileExtensions('/path.with.dots/file.tar.gz')).toEqual(['.tar.gz', '.gz']);
  });

  it('converts extensions to lowercase', () => {
    expect(getFileExtensions('file.TXT')).toEqual(['.txt']);
    expect(getFileExtensions('file.TAR.GZ')).toEqual(['.tar.gz', '.gz']);
  });
});

describe('isBinaryFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true for known binary extensions', async () => {
    const binaryFiles = [
      'image.jpg',
      'archive.tar.gz',
      'document.pdf',
      'program.exe',
      'library.dll',
    ];

    for (const file of binaryFiles) {
      const result = await isBinaryFile(file);
      expect(result).toBe(true);
      // Ensure checkBinaryFile wasn't called for known extensions
      expect(mockedCheckBinaryFile).not.toHaveBeenCalled();
    }
  });

  it('returns false when checkBinaryFile throws an error', async () => {
    mockedCheckBinaryFile.mockRejectedValue(new Error('File read error'));

    const result = await isBinaryFile('unknown.xyz');
    expect(result).toBe(false);
    expect(mockedCheckBinaryFile).toHaveBeenCalledWith('unknown.xyz');
  });

  it('caches results of checkBinaryFile', async () => {
    mockedCheckBinaryFile.mockResolvedValueOnce(true);

    // First call should check the file
    const result1 = await isBinaryFile('test.xyz');
    expect(result1).toBe(true);
    expect(mockedCheckBinaryFile).toHaveBeenCalledTimes(1);

    // Second call should use cached result
    const result2 = await isBinaryFile('another.xyz');
    expect(result2).toBe(true);
    expect(mockedCheckBinaryFile).toHaveBeenCalledTimes(1);
  });

  it('checks unknown extensions using checkBinaryFile', async () => {
    mockedCheckBinaryFile.mockResolvedValueOnce(false);

    const result = await isBinaryFile('text.unknown');
    expect(result).toBe(false);
    expect(mockedCheckBinaryFile).toHaveBeenCalledWith('text.unknown');
  });

  it('handles compound extensions correctly', async () => {
    mockedCheckBinaryFile.mockResolvedValueOnce(true);

    const result = await isBinaryFile('file.custom.format');
    expect(result).toBe(true);
    expect(mockedCheckBinaryFile).toHaveBeenCalledWith('file.custom.format');
  });

  it('handles files with no extension correctly', async () => {
    const filePath = 'file_without_extension';
    mockedCheckBinaryFile.mockResolvedValueOnce(true);

    const result = await isBinaryFile(filePath);
    expect(result).toBe(true);
    expect(mockedCheckBinaryFile).toHaveBeenCalledWith(filePath);
    expect(mockedCheckBinaryFile).toHaveBeenCalledTimes(1);

    // Edge case: because there's no extension, no result is cached. The method
    // will be called again.
    await isBinaryFile(filePath);
    expect(mockedCheckBinaryFile).toHaveBeenCalledTimes(2);
  });
});
