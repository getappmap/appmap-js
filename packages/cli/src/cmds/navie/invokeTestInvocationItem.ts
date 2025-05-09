import { TestInvocation } from '@appland/navie';
import configuration from '../../rpc/configuration';
import { isAbsolute, join } from 'path';
import { exec } from 'child_process';
import { AppMapConfig, LanguageName } from '../../lib/loadAppMapConfig';
import collectAppMapConfigByPath from '../../lib/collectAppMapConfigByPath';
import rebaseTestFileToProjectFile from './rebaseTestFileToProjectFile';

export const TEST_NAME_SYMBOL = '$(test_name)';

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
  if (!commandTemplate.includes(TEST_NAME_SYMBOL)) {
    console.warn(`Test name symbol ${TEST_NAME_SYMBOL} not found in command: ${commandTemplate}`);
    return;
  }

  const { rebasedFilePath, projectDirectory } = rebaseTestFileToProjectFile(languageName, filePath);

  const command = commandTemplate.replace(TEST_NAME_SYMBOL, rebasedFilePath);

  const commandOptions: { cwd?: string } = {};
  if (projectDirectory) {
    commandOptions.cwd = projectDirectory;
  } else {
    console.warn(`No project directory found for file path: ${filePath}`);
    console.warn(`Invoking test command in current directory: ${process.cwd()}`);
  }

  console.log(`Invoking test command: ${command}`);

  // NOTE reject is not used here, because command errors are reported as succeeded: false
  const testPromise = new Promise<ProcessResult>((resolve) => {
    exec(command, commandOptions, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        resolve({
          succeeded: false,
          error: error.message,
        });
        return;
      }

      if (stderr) console.log(`Command stderr: ${stderr}`);
      if (stdout) console.log(`Command stdout: ${stdout}`);

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
