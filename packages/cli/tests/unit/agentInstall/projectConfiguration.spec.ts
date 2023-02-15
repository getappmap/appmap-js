import { YarnInstaller } from '../../../src/cmds/agentInstaller/javaScriptAgentInstaller';
import { getYarnSubprojects } from '../../../src/cmds/agentInstaller/projectConfiguration';
import mockCommand from '../support/mockCommand';

describe(getYarnSubprojects, () => {
  it('finds no subprojects with yarn1 and no workspaces', () => {
    const installer = new YarnInstaller('/test/path');
    jest.spyOn(installer, 'isYarnVersionOne').mockResolvedValue(true);
    mockCommand('yarn workspaces info --json').toError(
      'yarn workspaces v1.22.19\n' +
        "error Cannot find the root of your workspace - are you sure you're currently in a workspace?\n" +
        'info Visit https://yarnpkg.com/en/docs/cli/workspaces for documentation about this command',
      1
    );
    return expect(getYarnSubprojects('/test/path', [installer])).resolves.toHaveLength(0);
  });
});

afterEach(jest.restoreAllMocks);
