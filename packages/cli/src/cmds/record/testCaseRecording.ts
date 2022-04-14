import { ChildProcess, exec, spawn } from 'child_process';
import { kill } from 'process';
import { verbose } from '../../utils';
import UI from '../userInteraction';
import { AppMapConfig, readConfig, readConfigOption } from './configuration';

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
    )) as string[];

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

    TestCaseProcesses = testCommands.map((cmd) => {
      UI.progress(`Running test command: ${cmd}`);
      const args = cmd.split(' ');
      return spawn(args[0], args.slice(1), {
        shell: true,
        stdio: ['ignore', 'inherit', 'inherit'],
      });
    });
  }

  static async waitFor(maxTime: number | undefined) {
    if (maxTime) UI.progress(`Running tests for up to ${maxTime} seconds.`);

    await Promise.all(
      TestCaseProcesses.map(
        (process) =>
          new Promise((resolve) => {
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
              if (interruptTimeout) clearTimeout(interruptTimeout);
              UI.progress(
                `Exit status: ${exitCode !== null ? exitCode : 'timeout'}`
              );
              resolve(exitCode);
            }

            if (process.exitCode) return report(process.exitCode);

            process.on('exit', report);
            if (maxTime) {
              interruptTimeout = setTimeout(interrupt, maxTime * 1000);
            }
          })
      )
    );
  }
}
