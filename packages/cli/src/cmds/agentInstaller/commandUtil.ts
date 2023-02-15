import { run } from '@appland/common/src/commandRunner';
import CommandStruct, { CommandOutput } from '@appland/common/src/commandStruct';

/**
 * Small utility method to run a command and return the output - ONE OF stdout OR stderr. This
 * function won't throw an error if the command fails. This method may be expanded in the future
 * to return both stdout and stderr combined, but as of now it is not necessary.
 * @param program The executable to run
 * @param args The arguments to pass to the executable
 * @param cwd The working directory to run the command in
 * @returns The output of the command
 */
export async function getOutput(
  program: string,
  args: string[],
  cwd: string
): Promise<CommandOutput> {
  try {
    const { stdout, stderr } = await run(new CommandStruct(program, args, cwd));
    return {
      output: stdout ? stdout : stderr,
      ok: true,
    };
  } catch (code) {
    const failure = { output: '' };

    if (code === 127) {
      failure.output = `${program} was not found`;
    } else {
      failure.output = `${program} failed with code ${code}`;
    }

    return failure;
  }
}
