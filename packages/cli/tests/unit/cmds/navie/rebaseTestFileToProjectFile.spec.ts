import { existsSync } from 'fs';
import { join } from 'path';
import rebaseTestFileToProjectFile from '../../../../src/cmds/navie/rebaseTestFileToProjectFile';

jest.mock('fs');

describe('rebaseTestFileToProjectFile', () => {
  let mockExistsSync: jest.MockedFunction<typeof existsSync>;
  const isWindows = process.platform === 'win32';

  beforeEach(() => {
    mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
    jest.clearAllMocks();
  });

  const makePath = (...parts: string[]) => {
    if (isWindows) {
      return join('C:', ...parts);
    }
    return join('/', ...parts);
  };

  it('returns original path for unknown language', () => {
    const testPath = makePath('test', 'file.test.ts');
    const result = rebaseTestFileToProjectFile('unknownlang', testPath);
    expect(result).toEqual({ rebasedFilePath: testPath });
  });

  it('finds project file in same directory', () => {
    mockExistsSync.mockImplementation((path) => path.toString().endsWith(`package.json`));

    const projectPath = makePath('project', 'test.js');
    const expectedPackageJson = makePath('project', 'package.json');

    const result = rebaseTestFileToProjectFile('javascript', projectPath);

    expect(result).toEqual({
      rebasedFilePath: 'test.js',
      projectDirectory: makePath('project'),
      projectFilePath: expectedPackageJson,
    });
  });

  it('finds project file in parent directory', () => {
    const filePath = makePath('project', 'tests', 'unit', 'test.js');
    const expectedPackageJson = makePath('project', 'package.json');

    mockExistsSync.mockImplementation((path) => path === expectedPackageJson);

    const result = rebaseTestFileToProjectFile('javascript', filePath);

    expect(result).toEqual({
      rebasedFilePath: join('tests', 'unit', 'test.js'),
      projectDirectory: makePath('project'),
      projectFilePath: expectedPackageJson,
    });
  });

  it('handles root directory case', () => {
    const filePath = isWindows ? 'C:\\test.js' : '/test.js';
    mockExistsSync.mockReturnValue(false);

    const result = rebaseTestFileToProjectFile('javascript', filePath);

    expect(result).toEqual({
      rebasedFilePath: filePath,
      projectDirectory: '.',
      projectFilePath: undefined,
    });
  });

  it('handles python with multiple project file types', () => {
    const filePath = makePath('project', 'tests', 'test.py');
    const expectedRequirements = makePath('project', 'requirements.txt');

    mockExistsSync.mockImplementation((path) => path === expectedRequirements);

    const result = rebaseTestFileToProjectFile('python', filePath);

    expect(result).toEqual({
      rebasedFilePath: join('tests', 'test.py'),
      projectDirectory: makePath('project'),
      projectFilePath: expectedRequirements,
    });
  });

  it('returns defaults when no project file is found', () => {
    const filePath = makePath('project', 'tests', 'test.js');
    mockExistsSync.mockReturnValue(false);

    const result = rebaseTestFileToProjectFile('javascript', filePath);

    expect(result).toEqual({
      rebasedFilePath: filePath,
      projectDirectory: '.',
      projectFilePath: undefined,
    });
  });

  it('limits the depth of the directory search', () => {
    // Create a deeply nested path that exceeds MAX_ITERATIONS (20)
    const deepParts = Array(25)
      .fill('nested')
      .map((part, i) => `${part}${i}`);
    const filePath = makePath(...deepParts, 'test.js');
    mockExistsSync.mockReturnValue(false);

    const result = rebaseTestFileToProjectFile('javascript', filePath);

    expect(result).toEqual({
      rebasedFilePath: filePath,
      projectDirectory: '.',
      projectFilePath: undefined,
    });
  });
});
