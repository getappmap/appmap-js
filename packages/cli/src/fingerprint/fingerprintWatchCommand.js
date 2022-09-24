const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const { verbose, listAppMapFiles } = require('../utils');
const FingerprintQueue = require('./fingerprintQueue');

class FingerprintWatchCommand {
  constructor(directory) {
    this.directory = directory;
    this.print = true;
    this.numProcessed = 0;
    this.pidfilePath = process.env.APPMAP_WRITE_PIDFILE && path.join(this.directory, 'index.pid');
  }

  removePidfile() {
    if (this.pidfilePath) {
      console.log(`Removing ${this.pidfilePath}`);
      fs.removeSync(this.pidfilePath);
      this.pidfilePath = null;
    }
  }

  async execute() {
    this.fpQueue = new FingerprintQueue();
    this.fpQueue.setCounterFn(() => {
      this.numProcessed += 1;
    });

    // Index existing AppMap files
    await listAppMapFiles(this.directory, (file) => this.fpQueue.push(file));
    this.fpQueue.process();

    const glob = `${this.directory}/**/*.appmap.json`;
    this.watcher = chokidar.watch(glob, {
      ignoreInitial: true,
      ignored: ['**/node_modules/**', '**/.git/**'],
    });
    this.poller = chokidar.watch(glob, {
      ignoreInitial: true,
      ignored: ['**/node_modules/**', '**/.git/**'],
      usePolling: true,
      interval: 1000,
      persistent: false,
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const ch of [this.watcher, this.poller]) {
      ch.on('add', this.added.bind(this))
        .on('change', this.changed.bind(this))
        .on('unlink', this.removed.bind(this));
    }

    await Promise.all(
      [this.watcher, this.poller].map((ch) => new Promise((resolve) => ch.on('ready', resolve)))
    );
    this.ready();
  }

  async close() {
    await Promise.all([this.watcher, this.poller].map((ch) => ch?.close()));
    this.removePidfile();
    this.watcher = null;
    this.poller = null;
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

  ready() {
    if (this.pidfilePath) {
      fs.outputFileSync(this.pidfilePath, `${process.pid}`);
      process.on('exit', this.removePidfile.bind(this));
    }
    if (verbose()) {
      console.warn(`Watching appmaps in ${path.resolve(process.cwd(), this.directory)}`);
    }
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
