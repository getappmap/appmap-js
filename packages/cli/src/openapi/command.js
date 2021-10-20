import { verbose } from '../utils';

const { promises: fsp } = require('fs');
const { queue } = require('async');
const { glob } = require('glob');
const yaml = require('js-yaml');
const { parseHTTPServerRequests } = require('./util');
const Model = require('./model');

class OpenAPICommand {
  constructor(directory) {
    this.directory = directory;
  }

  async execute() {
    this.count = 0;
    this.model = new Model();
    const q = queue(this.collectAppMap.bind(this), 5);
    q.pause();
    const files = await new Promise((resolve, reject) => {
      glob(`${this.directory}/**/*.appmap.json`, (err, globFiles) => {
        if (err) {
          return reject(err);
        }
        return resolve(globFiles);
      });
    });
    files.forEach((f) => q.push(f));
    await new Promise((resolve, reject) => {
      q.drain(resolve);
      q.error(reject);
      q.resume();
    });
    return this.model.openapi();
  }

  async collectAppMap(file) {
    this.count += 1;
    parseHTTPServerRequests(JSON.parse(await fsp.readFile(file)), (e) =>
      this.model.addRequest(e)
    );
  }
}

module.exports = {
  command: 'openapi',
  aliases: ['swagger'],
  describe: 'Generate OpenAPI from AppMaps in a directory',
  builder(args) {
    args.option('appmap-dir', {
      describe: 'directory to recursively inspect for AppMaps',
      default: 'tmp/appmap',
    });
    args.option('output-file', {
      alias: ['o'],
      describe: 'output file name',
    });
    return args.strict();
  },
  async handler(argv) {
    verbose(argv.verbose);

    const openapi = await new OpenAPICommand(argv.appmapDir).execute();
    const yamlRepr = yaml.dump(openapi);
    if (argv.outputFile) {
      await fsp.writeFile(argv.outputFile, yamlRepr);
    } else {
      console.log(yamlRepr);
    }
  },
};
