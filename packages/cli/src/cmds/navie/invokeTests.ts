import { TestInvocation } from '@appland/navie';
import { enqueueTestInvocationItem } from '../../rpc/test-invocation/requests';
import { existsSync } from 'fs';
import configuration from '../../rpc/configuration';
import path, { dirname, isAbsolute, join } from 'path';
import { exec } from 'child_process';
import loadAppMapConfig, { AppMapConfig, LanguageName } from '../../lib/loadAppMapConfig';
import { locateAppMapConfigFile } from '../../lib/locateAppMapConfigFile';

enum InvocationStrategy {
  SHELL = 'shell',
  RPC = 'rpc',
}

const DEFAULT_INVOCATION_STRATEGY = InvocationStrategy.SHELL;

const LANGUAGES_BY_EXTENSION: Record<string, LanguageName> = {
  rb: 'ruby',
  js: 'javascript',
  ts: 'javascript',
  py: 'python',
  java: 'java',
};

const TEST_NAME_SYMBOL = '$(test_name)';

type ProcessResult = {
  succeeded: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
};

async function collectAppMapConfigByPath(
  appMapDirectories: string[]
): Promise<Map<string, AppMapConfig>> {
  const appMapConfigByPath = new Map<string, AppMapConfig>();
  for (const directory of appMapDirectories) {
    const appmapConfigFile = await locateAppMapConfigFile(directory);
    if (!appmapConfigFile) {
      console.warn(`No AppMap config file found in directory: ${directory}`);
      continue;
    }

    const appmapConfig = await loadAppMapConfig(appmapConfigFile);
    if (!appmapConfig) {
      console.warn(`No AppMap config found at ${appmapConfigFile}`);
    } else {
      appMapConfigByPath.set(directory, appmapConfig);
      break;
    }
  }

  console.warn(
    `AppMap config files found in the following directories: ${Array.from(
      appMapConfigByPath.keys()
    ).join(', ')}`
  );

  return appMapConfigByPath;
}

async function invokeTestInvocationItem(
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

  let bestFilePath = filePath;
  let bestDirectory = '.';
  if (languageName === 'javascript') {
    let searchDirectory = dirname(filePath);
    while (searchDirectory !== path.parse(searchDirectory).root && searchDirectory !== '') {
      const packageJSONFile = join(searchDirectory, 'package.json');
      if (existsSync(packageJSONFile)) {
        bestFilePath = filePath.slice(searchDirectory.length + 1);
        bestDirectory = searchDirectory;
        break;
      }
      searchDirectory = dirname(searchDirectory);
    }

    console.log(
      `Closest ancestor directory for JavaScript test containing package.json: ${bestDirectory}`
    );
  }

  const command = commandTemplate.replace(TEST_NAME_SYMBOL, bestFilePath);

  console.log(`Invoking test command: ${command}`);

  const testPromise = new Promise<ProcessResult>((resolve, reject) => {
    exec(command, { cwd: bestDirectory }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        resolve({
          succeeded: false,
          error: error.message,
        });
      }
      if (stderr) {
        console.warn(`Error output: ${stderr}`);
      }
      console.log(`Command output: ${stdout}`);

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

export default async function invokeTests(
  request: TestInvocation.TestInvocationRequest
): Promise<TestInvocation.TestInvocationResponse> {
  const invocationStrategy: InvocationStrategy = (process.env.NAVIE_TEST_INVOCATION_STRATEGY ??
    DEFAULT_INVOCATION_STRATEGY) as InvocationStrategy;

  for (const item of request.testItems) {
    console.log(`Invoking test ${item.filePath} (${item.id})`);

    if (item.startLine && item.endLine)
      console.log(`Line range is given as ${item.startLine} to ${item.endLine}`);

    if (item.testName) console.log(`Test name is given as ${item.testName}`);

    console.log(`Enqueuing test item ${item.id} for async invocation`);

    if (invocationStrategy === InvocationStrategy.SHELL) {
      console.log(`Invoking test item ${item.id} using shell command`);
      await invokeTestInvocationItem(request.invocation, item);
    } else if (invocationStrategy === InvocationStrategy.RPC) {
      console.log(`Invoking test item ${item.id} using RPC`);

      // Handle async invocation only, for now
      if (request.invocation !== 'async') throw new Error('Only async invocation is supported');

      enqueueTestInvocationItem(item);
    } else {
      throw new Error(`Unknown invocation strategy: ${invocationStrategy}`);
    }
  }

  return Promise.resolve({
    testResults: [],
  });
}
