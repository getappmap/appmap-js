import { ChildProcess, exec, spawn } from 'child_process';
import { kill } from 'process';
import { verbose } from '../../utils';
import UI from '../userInteraction';
import { readConfig, readConfigOption, TestCommand } from './configuration';

let TestCommands: TestCommand[] = [];

let TestCaseProcesses: ChildProcess[] = [];

const DiagnosticCommands: Record<string, string[]> = {
  ruby: ['ruby -v', 'bundle info rails', 'bundle info actionpack'],
};

export default class TestCaseRecording {
  static async start() {
    const config = await readConfig();
    if (!config) throw new Error(`AppMap config file was not found`);
    if (!config.language)
      throw new Error(`AppMap config 'language' is not set`);

    TestCaseProcesses.forEach((process) => {
      if (process.pid) kill(process.pid);
    });
    TestCaseProcesses = [];

    let testCommands = (await readConfigOption(
      'test_recording.test_commands',
      []
    )) as TestCommand[];

    if (testCommands.length === 0)
      throw new Error(`No test commands are configured`);

    if (verbose()) {
      const diagnosticCommands = DiagnosticCommands[config.language!];
      if (diagnosticCommands) {
        await Promise.all(
          diagnosticCommands.map((cmd) => {
            return new Promise((resolve) => {
              const args = cmd.split(' ');
              const process = spawn(args[0], args.slice(1), {
                shell: true,
                stdio: ['ignore', 'inherit', 'inherit'],
              });
              process.on('error', resolve);
              process.on('exit', resolve);
            });
          })
        );
      }
    }

    TestCommands = testCommands;
  }

  static async waitFor(maxTime: number | undefined) {
    if (maxTime) UI.progress(`Running tests for up to ${maxTime} seconds.`);

    let waitTime = maxTime;
    async function waitForProcess(
      process: ChildProcess
    ): Promise<number | null | undefined> {
      const startTime = Date.now();
      return new Promise((resolve) => {
        let reported = false;
        let interruptTimeout: NodeJS.Timeout | undefined;

        function interrupt() {
          if (process.pid) {
            if (verbose())
              UI.progress(
                `Sending SIGTERM to ${process.pid} after ${maxTime} seconds.`
              );
            kill(process.pid, 'SIGTERM');
          }
        }

        function report(exitCode?: number | null) {
          if (reported) return;

          reported = true;
          const elapsed = Date.now() - startTime;
          if (waitTime) {
            waitTime -= elapsed / 1000;
          }
          if (interruptTimeout) clearTimeout(interruptTimeout);
          if (exitCode !== 0) {
            UI.progress(
              `Test command finished with non-zero exit code ${exitCode}`
            );
          }
          resolve(exitCode);
        }

        if (process.exitCode) return report(process.exitCode);

        process.on('exit', report);
        if (waitTime) {
          interruptTimeout = setTimeout(interrupt, waitTime * 1000);
        }
      });
    }

    for (const cmd of TestCommands) {
      UI.progress(
        `Running test command: ${TestCaseRecording.envString(cmd.env)}${
          cmd.command
        }`
      );
      const args = cmd.command.split(' ');
      const proc = spawn(args[0], args.slice(1), {
        env: Object.assign(process.env, cmd.env),
        shell: true,
        stdio: ['ignore', 'inherit', 'inherit'],
      });
      await waitForProcess(proc);
    }
  }

  static envString(env: Record<string, string>) {
    const str =
      Object.keys(env).length > 0
        ? Object.keys(env)
            .sort()
            .map((key) => [key, env[key]].join('='))
            .join(' ')
        : undefined;
    return str ? `${str} ` : '';
  }
}
