import process from 'process';
import JavaAgentInstaller from './javaAgentInstaller';
import RubyAgentInstaller from './rubyAgentInstaller';
import PythonAgentInstaller from './pythonAgentInstaller';
import ValidationError from './validationError';
import AbortError from './abortError';
import { verbose } from '../../utils';

const AGENT_INSTALLERS = {
  java: JavaAgentInstaller,
  ruby: RubyAgentInstaller,
  python: PythonAgentInstaller,
};

export const command = 'install-agent [project-type]';
export const describe = 'Install and configure an AppMap language agent';

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
    const InstallerClass = AGENT_INSTALLERS[language];
    if (!InstallerClass) {
      throw new ValidationError(
        `Unsupported AppMap agent language: ${argv.language}`
      );
    }

    const installer = new InstallerClass(dir);

    await installer.installAgentFlow.run();
    return installer.configureAgentFlow.run();
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
