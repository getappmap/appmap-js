import fs from 'fs/promises';
import { join } from 'path';
import { handler } from '../../../src/cmds/sequenceDiagramCompare';
import { ownedFixture, recording } from './support';
let fixture: Awaited<ReturnType<typeof ownedFixture>>;
beforeEach(async () => {
  fixture = await ownedFixture();
  await fixture.put(recording([]), recording([{ name: 'added' }]));
});
afterEach(async () => {
  jest.restoreAllMocks();
  await fixture.clean();
});
const run = (outputFile: string) =>
  handler({ baseAppmap: fixture.base, headAppmap: fixture.head, outputFile });
describe('Given owned inputs and a previous output', () => {
  it.each(['path', 'symlink', 'hardlink', 'head'])(
    'When output is a %s alias Then it is refused without changing either recording',
    async (kind) => {
      const before = await Promise.all([
        fs.readFile(fixture.base, 'utf8'),
        fs.readFile(fixture.head, 'utf8'),
      ]);
      let output = fixture.base;
      if (kind === 'head') output = fixture.head;
      if (kind === 'symlink') {
        output = join(fixture.dir, 'alias');
        await fs.symlink(fixture.base, output);
      }
      if (kind === 'hardlink') {
        output = join(fixture.dir, 'alias');
        await fs.link(fixture.base, output);
      }
      await expect(run(output)).rejects.toThrow(/input|alias/i);
      expect(
        await Promise.all([fs.readFile(fixture.base, 'utf8'), fs.readFile(fixture.head, 'utf8')])
      ).toEqual(before);
    }
  );
  it.each(['write', 'rename'])(
    'When %s fails before replacement Then old output and inputs survive and owned temp is cleaned',
    async (fault) => {
      await fs.writeFile(fixture.output, 'previous');
      const before = await fs.readFile(fixture.head, 'utf8');
      if (fault === 'write') {
        const write = fs.writeFile;
        jest
          .spyOn(fs, 'writeFile')
          .mockImplementationOnce(async (...args: Parameters<typeof fs.writeFile>) => {
            await write(args[0], 'partial');
            throw new Error('injected write fault');
          });
      } else jest.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('injected rename fault'));
      await expect(run(fixture.output)).rejects.toThrow(/injected/);
      expect(await fs.readFile(fixture.output, 'utf8')).toBe('previous');
      expect(await fs.readFile(fixture.head, 'utf8')).toBe(before);
      expect((await fs.readdir(fixture.dir)).sort()).toEqual([
        'base.appmap.json',
        'comparison.json',
        'head.appmap.json',
      ]);
    }
  );
});

describe('Given owned inputs and no previous output', () => {
  it('When a new output is published Then it gets the permissions of an ordinary new file', async () => {
    const reference = join(fixture.dir, 'reference');
    await fs.writeFile(reference, '');
    await run(fixture.output);
    const mode = async (file: string) => (await fs.stat(file)).mode & 0o777;
    expect(await mode(fixture.output)).toBe(await mode(reference));
  });
});
