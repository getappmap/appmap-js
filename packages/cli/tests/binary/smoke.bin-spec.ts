import { buildRubyProject, runUntilCompletion } from './helpers';

describe('appmap', () => {
  let projectPath: string;

  it('runs the help command', async () => {
    const res = await runUntilCompletion(['--help']);
    expect(res.stdout).toStrictEqual(expect.stringContaining('appmap <command>'));
  });

  describe('install', () => {
    beforeEach(async () => {
      projectPath = await buildRubyProject();
    });

    it('runs the installer', async () => {
      const res = await runUntilCompletion([
        'install',
        '--interactive=false',
        '--overwrite-appmap-config',
        projectPath,
      ]);
      expect(res.stdout).toStrictEqual(
        expect.stringContaining('Success! AppMap has finished installing.')
      );
    });
  });
});
