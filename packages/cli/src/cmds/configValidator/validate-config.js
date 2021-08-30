const fs = require('fs');
const { join } = require('path');
const process = require('process');

const yaml = require('js-yaml');
const Yargs = require('yargs');

const { verbose } = require('../../utils');
const validator = require('../../service/config/validator');

exports.command = 'validate-config <project type>';
exports.describe = 'Validate AppMap configuration';

const projectTypes = ['java', 'python', 'ruby'];
exports.builder = (yargs) => {
  yargs
    .positional('project type', {
      describe: 'the type of project to validate',
    })
    .choices('projecttype', projectTypes)
    .check((argv) => {
      if (argv.projecttype !== 'java') {
        return 'Only Java projects can currently be validated.';
      }
      return true;
    })
    .option('dir', {
      describe: 'directory in which to perform validation',
      default: '.',
      alias: 'd',
    });
};

const cmdHandler = async (
  schema,
  config,
  configFile,
  svc = validator,
  logger = console
) => {
  const result = svc.validateConfig(schema, config);
  if (result.valid) {
    logger.log(`\n${configFile} is valid.\n`);
    return 0;
  }

  logger.error(`\n${result.errors}\n`);
  return 1;
};

exports.handler = async (argv) => {
  verbose(argv.verbose);

  const schema = yaml.load(
    fs.readFileSync(join(__dirname, 'java-config-schema.yml'))
  );
  const configFile = join(argv.dir, 'appmap.yml');
  try {
    const config = yaml.load(fs.readFileSync(configFile, 'utf8'));

    Yargs.exit(await cmdHandler(schema, config, configFile));
  } catch (e) {
    if (e instanceof yaml.YAMLException) {
      console.error();
      console.error(e.message);
      console.error();
      process.exit(1);
    }
    throw e;
  }
};

exports.cmdHandler = cmdHandler;
