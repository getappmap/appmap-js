import { ChildProcess, exec, spawn } from 'child_process';
import { env, kill } from 'process';
import { promisify } from 'util';
import { exists } from '../../utils';
import { AppMapConfig, readConfig } from './configuration';
import inferTestCommands from './state/inferTestCommands';

let TestCaseProcesses: ChildProcess[] = [];

function prependCommandOptions(config: AppMapConfig, cmd: string): string {
  if (!config.language)
    throw new Error(
      `Configure 'language' in AppMap config file before proceeding.`
    );

  const optionsForLanguage: Record<string, string[]> = {
    ruby: ['env', 'APPMAP=true', 'DISABLE_SPRING=true'],
    python: ['env', 'APPMAP=true'],
    java: [],
    javascript: ['env', 'APPMAP=true'],
  };
  const option = optionsForLanguage[config.language!];
  if (!option) throw new Error(`Unsupported language: ${config.language}`);
  return [option.join(' '), cmd].join(' ');
}

export default class TestCaseRecording {
  static async start() {
    const config = await readConfig();
    if (!config) throw new Error(`AppMap config file was not found`);

    TestCaseProcesses.forEach((process) => {
      if (process.pid) kill(process.pid);
    });
    TestCaseProcesses = [];

    let testCommands = config.testCommands || (await inferTestCommands(config));
    if (!testCommands) {
      throw new Error(
        `No test commands configured, and default commands cannot be inferred for ${config.language}`
      );
    }

    TestCaseProcesses = testCommands
      .map(prependCommandOptions.bind(null, config))
      .map((cmd) => {
        console.log(`Running test command: ${cmd}`);
        const args = cmd.split(' ');
        return spawn(args[0], args.slice(1), {
          shell: true,
          stdio: ['ignore', 'inherit', 'inherit'],
        });
      })
      .map((process) => process);
  }

  static async waitFor() {
    await Promise.all(
      TestCaseProcesses.map(
        (process) =>
          new Promise((resolve) => {
            function report(exitCode: number) {
              console.log(
                `${process.spawnargs.join(' ')} exit status: ${exitCode}`
              );
              resolve(exitCode);
            }

            if (process.exitCode) return report(process.exitCode);

            process.on('exit', report);
          })
      )
    );
  }
}
