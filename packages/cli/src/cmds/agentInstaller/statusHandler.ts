import Yargs from 'yargs';
import { verbose } from '../../utils';
import UI from '../userInteraction';
import { INSTALLERS } from './installers';
import AgentStatusProcedure from './agentStatusProcedure';
import { getProjects } from './projectConfiguration';
import InstallerUI from './installerUI';

interface InstallCommandOptions {
  verbose?: any;
  projectType?: string;
  directory: string;
}

export default async function handler(argv: Yargs.ArgumentsCamelCase) {
  // The builder declares its options without types, so this shape is assumed rather than
  // derived from it.
  const args = argv as unknown as InstallCommandOptions;
  const { projectType, directory, verbose: isVerbose } = args;
  const installers = INSTALLERS.map((constructor) => new constructor(directory));

  verbose(isVerbose);

  const ui = new InstallerUI(false, { overwriteAppMapConfig: false });
  try {
    const [project] = await getProjects(ui, installers, directory, false, projectType);

    const statusProcedure = new AgentStatusProcedure(
      project.selectedInstaller!,
      directory
    );

    await statusProcedure.run(ui);
  } catch (e) {
    const err = e as Error;
    UI.error(err.message);
    Yargs.exit(1, err);
  }
}
