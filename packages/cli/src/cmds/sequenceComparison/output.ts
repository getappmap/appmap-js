import { randomBytes } from 'crypto';
import { lstat, stat, realpath, mkdir, writeFile, rename, unlink, open } from 'fs/promises';
import { basename, dirname, join, resolve } from 'path';

export async function refuseInputAlias(output: string, inputs: string[]): Promise<void> {
  const inputPaths = await Promise.all(inputs.map((input) => realpath(input)));
  if (
    inputs.some((input) => resolve(input) === resolve(output)) ||
    inputPaths.includes(resolve(output))
  )
    throw new Error('Comparison output aliases an input recording');
  try {
    const target = await stat(output);
    for (const input of inputs) {
      const source = await stat(input);
      if (source.dev === target.dev && source.ino === target.ino)
        throw new Error('Comparison output aliases an input recording');
    }
    if ((await lstat(output)).isSymbolicLink())
      throw new Error('Comparison output must not be a symlink');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
/** Same-directory rename publishes a complete file; never truncate the old output.
 * Recheck aliases before replacement. This is not a lock against hostile path races
 * or a power-loss durability guarantee; concurrent writers are last-rename-wins.
 */
export async function writeComparison(
  output: string,
  inputs: string[],
  contents: string
): Promise<void> {
  await refuseInputAlias(output, inputs);
  await mkdir(dirname(output), { recursive: true });
  const temp = join(dirname(output), `.${basename(output)}.${randomBytes(12).toString('hex')}.tmp`);
  let owned = false;
  // Reserve exclusively so cleanup never unlinks another writer's file. Like writeFile, let
  // the umask decide the published file's permissions; replacing an existing output also
  // resets its permissions to that default.
  const handle = await open(temp, 'wx', 0o666);
  owned = true;
  try {
    await handle.close();
    await writeFile(temp, contents, 'utf8');
    await refuseInputAlias(output, inputs);
    await rename(temp, output);
    owned = false;
  } finally {
    if (owned)
      await unlink(temp).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
  }
}
