import { ChildProcess, exec, spawn } from 'child_process';
import { exitCode, kill } from 'process';
import { exists, verbose } from '../../utils';
import UI from '../userInteraction';
import {
  readConfig,
  readConfigOption,
  readSetting,
  TestCommand,
} from './configuration';
import RecordContext, { RecordProcessResult } from './recordContext';

let TestCommands: TestCommand[] = [];

let TestCaseProcesses: ChildProcess[] = [];

const DiagnosticCommands: Record<string, string[]> = {
  Gemfile: ['ruby -v', 'bundle info rails', 'bundle info actionpack'],
};

export default class TestCaseRecording {
  static async start() {
    TestCaseProcesses.forEach((process) => {
      if (process.pid) kill(process.pid);
    });
    TestCommands = [];
    TestCaseProcesses = [];

    let testCommands = (await readConfigOption(
      'test_recording.test_commands',
      []
    )) as TestCommand[];

    if (testCommands.length === 0)
      throw new Error(`No test commands are configured`);

    if (verbose()) {
      const pathExists = await Promise.all(
        Object.keys(DiagnosticCommands).map(async (path) => await exists(path))
      );
      const diagnosticCommands = Object.keys(DiagnosticCommands)
        .filter((_, idx) => pathExists[idx])
        .map((path) => DiagnosticCommands[path])
        .flat();

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

    TestCommands = testCommands;
  }

  static async waitFor(ctx: RecordContext): Promise<void> {
    let maxTime: number | undefined = (await readSetting(
      'test_recording.max_time',
      -1
    )) as number;

    if (maxTime === -1) maxTime = undefined;

    if (maxTime) UI.progress(`Running tests for up to ${maxTime} seconds`);

    let waitTime = maxTime;
    async function waitForProcess(
      process: ChildProcess
    ): Promise<{ exitCode: number; output: string }> {
      const commandStr = process.spawnargs.join(' ');
      const startTime = Date.now();
      return new Promise((resolve) => {
        let reported = false;
        let interruptTimeout: NodeJS.Timeout | undefined;

        function interrupt() {
          if (process.pid) {
            UI.progress(
              `Stopping test command after ${maxTime} seconds: ${commandStr}`
            );
            kill(process.pid, 'SIGTERM');
          }
        }

        const output: string[] = [];
        function report(exitCode: number) {
          if (reported) return;

          reported = true;
          const elapsed = Date.now() - startTime;
          if (waitTime) {
            waitTime -= elapsed / 1000;
          }
          if (interruptTimeout) clearTimeout(interruptTimeout);
          if (exitCode && exitCode !== 0) {
            UI.progress(
              `Test command failed with status code ${exitCode}: ${commandStr}`
            );
          }
          resolve({ exitCode, output: output.join() });
        }

        if (process.exitCode) return report(process.exitCode);

        const onData = (data) => {
          output.push(data.toString());
        };
        process.stdout?.on('data', onData);
        process.stderr?.on('data', onData);

        process.on('exit', report);
        if (waitTime) {
          interruptTimeout = setTimeout(interrupt, waitTime * 1000);
        }
      });
    }

    for (const cmd of TestCommands) {
      cmd.env ||= {};
      UI.progress(
        `Running test command: ${TestCaseRecording.envString(cmd.env)}${
          cmd.command
        }`
      );
      const args = cmd.command.split(' ');
      const env = Object.assign(process.env, cmd.env);
      const proc = spawn(args[0], args.slice(1), {
        env,
        shell: true,
        stdio: ['ignore'],
      });
      const { exitCode, output } = await waitForProcess(proc);
      ctx.addResult(
        new RecordProcessResult(env, cmd.command, exitCode, output)
      );
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
