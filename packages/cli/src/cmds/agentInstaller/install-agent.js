const process = require('process');
const readline = require('readline');
const { exec } = require('child_process');
const { verbose } = require('../../utils');
const JavaAgentInstaller = require('./javaAgentInstaller');
const RubyAgentInstaller = require('./rubyAgentInstaller');
const { PythonAgentInstaller } = require('./pythonAgentInstaller');
const ValidationError = require('./validationError');
const AbortError = require('./abortError');

const AGENT_INSTALLERS = {
  java: (dir) => new JavaAgentInstaller(dir),
  ruby: (dir) => new RubyAgentInstaller(dir),
  python: (dir) => new PythonAgentInstaller(dir),
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
    const installerFn = AGENT_INSTALLERS[language];
    if (!installerFn) {
      throw new ValidationError(
        `Unsupported AppMap agent language : ${argv.language}`
      );
    }
    const installer = installerFn(dir);

    const runCommand = async (command) => {
      const commandString = [command.program].concat(command.args).join(' ');
      return new Promise((resolve, reject) => {
        const cp = exec(commandString, {
          env: Object.assign(process.env, command.environment),
          cwd: dir,
        });
        cp.stderr.on('data', (data) => {
          process.stderr.write(data);
        });
        cp.stdout.on('data', (data) => {
          process.stderr.write(data);
        });

        cp.on('exit', (code) => {
          console.log(`'${command.program}' exited with code ${code}`);
          if (code === 0) {
            return resolve();
          }

          return reject(code);
        });
      });
    };

    function askQuestion(query) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      return new Promise((resolve, reject) =>
        rl.question(query, (answer) => {
          rl.close();
          if (answer === 'a') {
            reject(new AbortError());
          }
          resolve(answer);
        })
      );
    }

    const steps = installer.installAgent('.');
    await Promise.all(
      steps.map(async (step) => {
        let userAction;

        if (step.assumptions) {
          console.warn(step.assumptions);
          console.warn('');
          userAction = await askQuestion(
            `Press enter to continue, 'a' abort, or 'm' to run it yourself manually: `
          );

          if (userAction !== 'm') {
            const { installCommand } = step;
            if (typeof installCommand === 'function') {
              const result = await installCommand();
              console.log(result);
            } else {
              await runCommand(installCommand);
            }
          }
        }

        console.warn('');
        console.warn(step.postInstallMessage);
        console.warn('');
        if (step.verifyCommand) {
          console.warn(
            [
              '  ',
              step.verifyCommand.program,
              step.verifyCommand.args.join(' '),
            ].join(' ')
          );

          console.warn('');
          userAction = await askQuestion(
            `Press enter to continue, 'a' abort, or 'm' to run it yourself manually: `
          );

          if (userAction !== 'm') {
            await runCommand(step.verifyCommand);
          }
        } else {
          console.warn('');
          userAction = await askQuestion(`Press enter to continue:`);
        }
      })
    );
  };

  try {
    return await commandFn();
  } catch (err) {
    if (err instanceof ValidationError) {
      console.warn(err.message);
      return process.exit(1);
    }
    if (err instanceof AbortError) {
      return process.exit(2);
    }

    throw err;
  }
};
