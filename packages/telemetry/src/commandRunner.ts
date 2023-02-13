import { ChildProcess, execSync, spawn } from 'child_process';
import path from 'path';
import chalk from 'chalk';
import CommandStruct, { CommandReturn } from './commandStruct';
import { verbose } from '@appland/appmap/src/utils';
import { ChildProcessError } from '@appland/appmap/src/cmds/errors';

export class ProcessLog {
  public static buffer = '';

  public static log(command: string, childProcess: ChildProcess) {
    this.buffer = this.buffer.concat(`\n\nRunning command: \`${command}\`\n\n`);
    childProcess.stdout?.on('data', (data: string) => {
      this.buffer = this.buffer.concat(data);
    });
    childProcess.stderr?.on('data', (data: string) => {
      this.buffer = this.buffer.concat(data);
    });
  }

  public static recordExit(program: string, code: number | null, signal: NodeJS.Signals | null) {
    const codeString = code === null ? '' : code.toString();
    const signalString = signal === null ? '' : signal.toString();
    this.buffer.concat(
      `\n\n'${program}' exited with code ${codeString}, signal ${signalString}\n\n`
    );
  }

  // Return the current buffer and clear it for future use
  public static consumeBuffer() {
    const buffer = this.buffer;
    this.buffer = '';
    return buffer;
  }
}

interface CommandOutputChunk {
  stream: 'stdout' | 'stderr';
  data: string;
}

class CommandOutput {
  private chunks: CommandOutputChunk[] = [];

  append(stream: 'stdout' | 'stderr', data: string) {
    this.chunks.push({ stream, data });
  }

  get stdout() {
    return this.chunks
      .filter((chunk) => chunk.stream === 'stdout')
      .map((chunk) => chunk.data)
      .join('');
  }

  get stderr() {
    return this.chunks
      .filter((chunk) => chunk.stream === 'stderr')
      .map((chunk) => chunk.data)
      .join('');
  }

  get all() {
    return this.chunks.map((chunk) => chunk.data).join('');
  }
}

export async function run(command: CommandStruct): Promise<CommandReturn> {
  return new Promise((resolve, reject) => {
    const cp = spawn(command.program, command.args, {
      shell: true,
      env: command.environment,
      cwd: command.path as string,
    });

    const output = new CommandOutput();

    if (verbose()) {
      console.log(
        [
          `Running command: \`${chalk.yellow(command.toString())}\``,
          `cwd: ${chalk.yellow(path.resolve(command.path as string))}`,
          `environment: ${chalk.yellow(JSON.stringify(command.environment, undefined, 2))}`,
        ].join('\n')
      );

      cp.stderr?.pipe(process.stderr);
      cp.stdout?.pipe(process.stdout);
    }

    cp.stderr?.on('data', (data: Record<string, unknown>) => {
      output.append('stderr', data.toString());
    });

    cp.stdout?.on('data', (data: Record<string, unknown>) => {
      output.append('stdout', data.toString());
    });

    ProcessLog.log(command.toString(), cp);

    cp.on('error', (err: Error) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new ChildProcessError(
            command.toString(),
            `${command.program} was not found. Verify the command can be found in your PATH and try again.`
          )
        );
      }

      reject(err);
    });

    cp.on('exit', (code, signal) => {
      if (verbose()) {
        const codeStr = code === null ? '' : code.toString();
        console.log(`'${command.program}' exited with code ${codeStr}`);
      }

      ProcessLog.recordExit(command.program, code, signal);

      if (code === 0) {
        return resolve({
          stdout: output.stdout,
          stderr: output.stderr,
          code: code,
        });
      }

      return reject(new ChildProcessError(command.toString(), output.all, code));
    });
  });
}

export function runSync(command: CommandStruct) {
  const ret = execSync(command.toString(), {
    env: command.environment,
    cwd: command.path as string,
    stdio: 'pipe',
  });

  return ret.toString();
}
