import { ReadLine } from 'readline';
import Context from './context';

export default async function navigate(
  rl: ReadLine,
  context: Context,
  search: () => Promise<void>,
  home: () => void
) {
  return new Promise<void>((resolve) => {
    rl.question(
      `Enter code object id: `,
      // eslint-disable-next-line consistent-return
      async (codeObjectId) => {
        context.codeObjectId = codeObjectId;
        await search();
        home();
      }
    );
  });
}
