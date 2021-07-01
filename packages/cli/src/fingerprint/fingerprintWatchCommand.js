const chokidar = require('chokidar');
const { verbose } = require('../utils');
const FingerprintQueue = require('./fingerprintQueue');

class FingerprintWatchCommand {
  constructor(directory) {
    this.directory = directory;
    this.print = true;
    this.numProcessed = 0;
  }

  execute() {
    if (verbose()) {
      console.warn(`Watching appmaps in ${this.directory}`);
    }

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
      .on('unlink', this.removed.bind(this));
  }

  close() {
    this.watcher.close();
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

  enqueue(file) {
    // This shouldn't be necessary, but it's passing through the wrong file names.
    if (!file.includes('.appmap.json')) {
      return;
    }
    this.fpQueue.push(file);
  }
}

module.exports = FingerprintWatchCommand;
