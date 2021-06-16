const { promises: fsp } = require('fs');
const { queue } = require('async');
const { glob } = require('glob');
const { parseHTTPServerRequests } = require('./util');
const Model = require('./model');

class SwaggerCommand {
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
    return this.model.swagger();
  }

  async collectAppMap(file) {
    this.count += 1;
    parseHTTPServerRequests(JSON.parse(await fsp.readFile(file)), (e) =>
      this.model.addRequest(e)
    );
  }
}

module.exports = SwaggerCommand;
