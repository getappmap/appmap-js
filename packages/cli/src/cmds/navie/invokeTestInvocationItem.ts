import { TestInvocation } from '@appland/navie';
import configuration from '../../rpc/configuration';
import { isAbsolute, join } from 'path';
import { exec } from 'child_process';
import { AppMapConfig, LanguageName } from '../../lib/loadAppMapConfig';
import collectAppMapConfigByPath from '../../lib/collectAppMapConfigByPath';
import rebaseTestFileToProjectFile from './rebaseTestFileToProjectFile';
import { log } from 'console';

export const TEST_NAME_SYMBOL = '$(test_name)';
export const TEST_CLASS_SYMBOL = '$(test_class)';

export type ProcessResult = {
  succeeded: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
};

export const LANGUAGES_BY_EXTENSION: Record<string, LanguageName> = {
  rb: 'ruby',
  js: 'javascript',
  ts: 'javascript',
  py: 'python',
  java: 'java',
};

export default async function invokeTestInvocationItem(
  invocation: 'sync' | 'async',
  item: TestInvocation.TestInvocationItem
): Promise<void | ProcessResult> {
  const { filePath } = item;

  const config = configuration();
  const appmapDirectories = (await config.appmapDirectories()).map(
    (appmapDir) => appmapDir.directory
  );

  const appMapConfigByPath = await collectAppMapConfigByPath(appmapDirectories);

  let appMapConfigFile: string | undefined;
  let appMapConfig: AppMapConfig | undefined;
  for (const [directory, appMapConfigValue] of appMapConfigByPath) {
    const fullFilePath = isAbsolute(filePath) ? filePath : join(directory, filePath);
    if (fullFilePath.startsWith(directory)) {
      appMapConfigFile = directory;
      appMapConfig = appMapConfigValue;
      break;
    }
  }

  if (!appMapConfig) {
    console.error(`No AppMap config found for file path: ${filePath}`);
    return;
  }

  console.log(`Found AppMap config for file path ${filePath}: ${appMapConfigFile}`);

  const { test_commands: testCommands } = appMapConfig;

  if (!testCommands || testCommands.length === 0) {
    console.warn(`No test commands found in AppMap config for file path: ${filePath}`);
    return;
  }

  const languageExtension = filePath.split('.').pop();
  if (!languageExtension) {
    console.warn(`No language extension found for file path: ${filePath}`);
    return;
  }

  const languageName = LANGUAGES_BY_EXTENSION[languageExtension];
  if (!languageName) {
    console.warn(`No language name found for file extension: ${languageExtension}`);
    return;
  }

  const testCommand = testCommands.find((command) => command.language === languageName);
  if (!testCommand) {
    console.warn(`No test command found for language: ${languageName}`);
    return;
  }

  const { command: commandTemplate } = testCommand;

  const { rebasedFilePath, projectDirectory } = rebaseTestFileToProjectFile(languageName, filePath);

  let command: string;
  if (commandTemplate.includes(TEST_NAME_SYMBOL)) {
    command = commandTemplate.replace(TEST_NAME_SYMBOL, rebasedFilePath);
  } else if (commandTemplate.includes(TEST_CLASS_SYMBOL)) {
    const testFileNameToTestClassName = (filePath: string) => {
      // TODO: Getting this working for now; needs a more robust refactor.
      let normalizedFilePath = filePath;
      if (filePath.startsWith('src/test/java'))
        normalizedFilePath = filePath.slice('src/test/java'.length + 1);
      if (normalizedFilePath.endsWith('.java'))
        normalizedFilePath = normalizedFilePath.slice(0, -5);
      const parts = normalizedFilePath.split('/');
      return parts.join('.');
    };
    command = commandTemplate.replace(
      TEST_CLASS_SYMBOL,
      testFileNameToTestClassName(rebasedFilePath)
    );
  } else {
    throw new Error(
      `Test command template does not contain ${TEST_NAME_SYMBOL} or ${TEST_CLASS_SYMBOL}`
    );
  }

  console.log(`Invoking test command: ${command}`);

  const commandOptions: { cwd?: string; shell?: string; timeout?: number } = {};
  if (projectDirectory) {
    console.log(`Setting working directory to: ${projectDirectory}`);
    commandOptions.cwd = projectDirectory;
  } else {
    console.warn(`No project directory found for file path: ${filePath}`);
    console.warn(`Invoking test command in current directory: ${process.cwd()}`);
  }

  if (testCommand.shell) {
    console.log(`Using shell: ${testCommand.shell}`);
    commandOptions.shell = testCommand.shell;
  }
  if (testCommand.timeout) {
    console.log(`Setting timeout to: ${testCommand.timeout}`);
    commandOptions.timeout = parseInt(testCommand.timeout.toString(), 10);
  }

  // NOTE reject is not used here, because command errors are reported as succeeded: false
  const testPromise = new Promise<ProcessResult>((resolve) => {
    exec(command, commandOptions, (error, stdout, stderr) => {
      const logStderrAndStdout = () => {
        if (stderr) console.log(`Command stderr: ${stderr}`);
        if (stdout) console.log(`Command stdout: ${stdout}`);
      };

      if (error) {
        console.error(`Error executing command: ${error.message}`);
        logStderrAndStdout();
        resolve({
          succeeded: false,
          error: error.message,
        });
        return;
      }

      logStderrAndStdout();

      resolve({
        succeeded: true,
        stdout,
        stderr,
      });
    });
  });

  if (invocation === 'sync') {
    return await testPromise;
  }
}
