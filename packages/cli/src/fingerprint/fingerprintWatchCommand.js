const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const { verbose } = require('../utils');
const FingerprintQueue = require('./fingerprintQueue');

class FingerprintWatchCommand {
  constructor(directory) {
    this.directory = directory;
    this.print = true;
    this.numProcessed = 0;
    this.pidfilePath =
      process.env.APPMAP_WRITE_PIDFILE &&
      path.join(this.directory, 'index.pid');
  }

  removePidfile() {
    if (this.pidfilePath) {
      console.log(`Removing ${this.pidfilePath}`);
      fs.removeSync(this.pidfilePath);
      this.pidfilePath = null;
    }
  }

  execute() {
    return new Promise((resolve) => {
      this.fpQueue = new FingerprintQueue();
      this.fpQueue.setCounterFn(() => {
        this.numProcessed += 1;
      });
      this.fpQueue.process();
      this.watcher = chokidar.watch(`${this.directory}/**/*.appmap.json`, {
        ignoreInitial: true,
      });
      this.watcher
        .on('add', this.added.bind(this))
        .on('change', this.changed.bind(this))
        .on('unlink', this.removed.bind(this))
        .on('ready', this.ready.bind(this, resolve));
    });
  }

  async close() {
    await this.watcher.close();
    this.removePidfile();
    this.watcher = null;
  }

  added(file) {
    if (verbose()) {
      console.warn(`AppMap added: ${file}`);
    }
    this.enqueue(file);
  }

  changed(file) {
    if (verbose()) {
      console.warn(`AppMap changed: ${file}`);
    }
    this.enqueue(file);
  }

  // eslint-disable-next-line class-methods-use-this
  removed(file) {
    console.warn(`TODO: AppMap removed: ${file}`);
  }

  ready(resolve) {
    if (this.pidfilePath) {
      fs.outputFileSync(this.pidfilePath, `${process.pid}`);
      process.on('exit', this.removePidfile.bind(this));
    }
    if (verbose()) {
      console.warn(
        `Watching appmaps in ${path.resolve(process.cwd(), this.directory)}`
      );
    }
    resolve();
  }

  enqueue(file) {
    // This shouldn't be necessary, but it's passing through the wrong file names.
    if (!file.includes('.appmap.json')) {
      return;
    }
    this.fpQueue.push(file);
  }
}

module.exports = FingerprintWatchCommand;
