import process from 'process';
import JavaAgentInstaller from './javaAgentInstaller';
import RubyAgentInstaller from './rubyAgentInstaller';
import PythonAgentInstaller from './pythonAgentInstaller';
import ValidationError from './validationError';
import AbortError from './abortError';
import { verbose } from '../../utils';
import AgentInstallerProcedure from './agentInstallerProcedure';
import chalk from 'chalk';
import UI from './userInteraction';

const AGENT_INSTALLERS = {
  java: JavaAgentInstaller,
  ruby: RubyAgentInstaller,
  python: PythonAgentInstaller,
};

const AGENT_FRAMEWORK_INSTALLERS = Object.values(AGENT_INSTALLERS)
  .flatMap((installerLanguage) =>
    // Take every sub-installer and return it as an array of objects formatted like so:
    // { maven: { installerFramework: MavenAgentInstaller, installerLanguage: JavaAgentInstaller }}
    // { gradle: { installerFramework: GradleAgentInstaller, installerLanguage: JavaAgentInstaller }}
    // etc.
    installerLanguage.installers.map((installerFramework) => ({
      [new installerFramework().name.toLowerCase()]: {
        installerLanguage,
        installerFramework,
      },
    }))
  )
  .reduce((acc, entry) => ({ ...acc, ...entry }), {});

export const command = 'install-agent [project-type]';
export const describe = 'Install and configure an AppMap language agent';

function supportedTargetsMessage(): string {
  const supportedLanguages = Object.keys(AGENT_INSTALLERS)
    .map((name) => chalk.blue(name))
    .join(', ');

  const supportedFrameworks = Object.keys(AGENT_FRAMEWORK_INSTALLERS)
    .map((name) => chalk.blue(name))
    .join(', ');

  return [
    `Supported languages: ${supportedLanguages}`,
    `Supported project frameworks: ${supportedFrameworks}`,
  ].join('\n');
}

export const builder = (args) => {
  args.positional('project-type', {
    describe: [
      'Specifies the installation target. This may be a language or project framework. Case-insensitive.',
      supportedTargetsMessage(),
    ].join('\n'),
    type: 'string',
    default: undefined,
  });
  args.option('dir', {
    describe: 'directory in which to install',
    default: '.',
    alias: 'd',
  });
  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);

  const commandFn = async () => {
    const { projectType, dir } = argv;
    let installTarget = projectType;
    if (!installTarget) {
      const { result } = await UI.prompt({
        type: 'list',
        name: 'result',
        message: 'Select a target language for agent installation.',
        choices: Object.values(AGENT_INSTALLERS).map((i) => i.name),
      });
      installTarget = result;
    }

    installTarget = installTarget.toLowerCase();

    let installerOptions = AGENT_INSTALLERS[installTarget];
    let installerFramework;

    if (!installerOptions) {
      const installerInfo = AGENT_FRAMEWORK_INSTALLERS[installTarget];

      if (!installerInfo) {
        UI.error(
          [
            `${chalk.red(installTarget)} is not a supported installer type.`,
            supportedTargetsMessage(),
          ].join('\n')
        );
        process.exit(1);
      }

      // The user has specified a framework
      installerOptions = installerInfo.installerLanguage;
      installerFramework = installTarget;
    }

    const installer = new AgentInstallerProcedure(installerOptions, dir);
    await installer.run(installerFramework);
  };

  return commandFn().catch((err) => {
    if (err instanceof ValidationError) {
      console.warn(err.message);
      return process.exit(1);
    }
    if (err instanceof AbortError) {
      return process.exit(2);
    }

    if (verbose()) {
      UI.error(err);
    } else {
      UI.error(
        `An error occurred. Try re-running the command with the ${chalk.red(
          'verbose'
        )} flag (${chalk.red('-v')}).`
      );
    }
  });
};
