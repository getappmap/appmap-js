const process = require('process');
const { verbose } = require('../../utils');
const { JavaAgentInstaller } = require('./javaAgentInstaller');
const { RubyAgentInstaller } = require('./rubyAgentInstaller');
const { PythonAgentInstaller } = require('./pythonAgentInstaller');
const ValidationError = require('./validationError');
const AbortError = require('./abortError');

const AGENT_INSTALLERS = {
  java: JavaAgentInstaller,
  ruby: RubyAgentInstaller,
  python: PythonAgentInstaller,
};

exports.command = 'install-agent <language>';
exports.describe = 'Install and configure an AppMap language agent';

exports.builder = (args) => {
  args.positional('language', {
    describe: 'Which language agent to install',
  });
  args.option('dir', {
    describe: 'directory in which to install',
    default: '.',
    alias: 'd',
  });
  return args.strict();
};

exports.handler = async (argv) => {
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
    await installer.configureAgentFlow.run();
    return installer.validateAgentFlow.run();
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
