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

export const command = 'install-agent [project-type]';
export const describe = 'Install and configure an AppMap language agent';

function supportedTargetsMessage(): string {
  const supportedLanguages = Object.keys(AGENT_INSTALLERS)
    .map((name) => chalk.blue(name))
    .join(', ');

  return `Supported languages: ${supportedLanguages}`;
export const builder = (args) => {
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
    const { language, dir } = argv;
    let installerOptions = AGENT_INSTALLERS[language];
    if (!installerOptions) {
        UI.error(
        [
          `${chalk.red(installTarget)} is not a supported installer type.`,
          supportedTargetsMessage(),
        ].join('\n')
      );
      process.exit(1);
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

    throw err;
  });
};
