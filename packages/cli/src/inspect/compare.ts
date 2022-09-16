import { ReadLine } from 'readline';
import Context from './context';
import { diffLines } from 'diff';
import { dump as yamlDump } from 'js-yaml';
import assert from 'assert';
import { FunctionStats } from '../search/types';

const FgGreen = '\x1b[32m';
const FgMagenta = '\x1b[35m';
const FgWhite = '\x1b[37m';

export default async function compare(
  rl: ReadLine,
  context: Context,
  buildBaseStats: () => Promise<FunctionStats>,
  home: () => void
): Promise<void> {
  const baseStats = await buildBaseStats();

  assert(context.stats, 'context.stats');

  const baseComparableState = yamlDump(baseStats.toComparableState());
  const workingComparableState = yamlDump(context.stats.toComparableState());

  const diff = diffLines(baseComparableState, workingComparableState);

  diff.forEach((entry) => {
    // eslint-disable-next-line no-nested-ternary
    const color = entry.added ? FgGreen : entry.removed ? FgMagenta : FgWhite;
    entry.value.split('\n').forEach((line) => {
      if (line.trim() === '') {
        return;
      }
      console.log(`%s%s\x1b[0m`, color, line);
    });
  });

  rl.question(
    `Press enter to continue: `,
    // eslint-disable-next-line consistent-return
    () => home()
  );
}
