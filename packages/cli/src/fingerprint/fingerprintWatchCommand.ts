import { Metadata } from '@appland/models';
import { FSWatcher, watch } from 'chokidar';
import { removeSync, outputFileSync } from 'fs-extra';
import { join, resolve } from 'path';
import EventAggregator from '../lib/eventAggregator';
import flattenMetadata from '../lib/flattenMetadata';
import { intersectMaps } from '../lib/intersectMaps';
import Telemetry from '../telemetry';
import { verbose } from '../utils';
import { FingerprintEvent } from './fingerprinter';
import FingerprintQueue from './fingerprintQueue';
import Globber from './globber';
import path from 'path';
import { countReset } from 'console';
//const fs = require('fs');
import * as fs from 'node:fs';

export default class FingerprintWatchCommand {
  private pidfilePath: string | undefined;
  public fpQueue: FingerprintQueue;
  public watcher?: FSWatcher;
  private poller?: Globber;
  private _numProcessed = 0;
  public unreadableFiles = new Set();
  private fileDescriptors: any[] = [];

  public get numProcessed() {
    return this._numProcessed;
  }

  private set numProcessed(value) {
    this._numProcessed = value;
  }

  constructor(private directory: string) {
    this.pidfilePath = process.env.APPMAP_WRITE_PIDFILE && join(this.directory, 'index.pid');
    this.fpQueue = new FingerprintQueue();
    this.testFileDescriptors();

    new EventAggregator((events) => {
      const indexEvents = events.map(({ args: [event] }) => event) as FingerprintEvent[];
      this.sendTelemetry(indexEvents.map(({ metadata }) => metadata));
      this.numProcessed += events.length;
    }).attach(this.fpQueue.handler, 'index');
  }

  testFileDescriptors() {
    let filesMax = 1048576;
    //filesMax = 1024;
    let counter = 1;
    while (counter < filesMax) {
      const filename = "/home/test/tmp/blank_open_files/filename_" + counter.toString();
      try {
        console.debug("opening " + filename);
        const fd = fs.openSync(filename, 'w+');
        fs.writeFileSync(fd, "some data");
        fs.closeSync(fd);
        console.debug("writing in " + filename + " worked");
      } catch (err) {
        console.debug("*** unable to create file " + filename);
      }
      counter += 1;
    }

    // open file descriptors
    counter = 1;
    while (counter < filesMax) {
      const filename = "/home/test/tmp/blank_open_files/filename_" + counter.toString();
      const fd = fs.openSync(filename, 'w');
      //console.debug("saved fd " + fd.toString());
      this.fileDescriptors.push(fd);
      counter += 1;
    }

    // close all file descriptors
    /*
    counter = 1;
    while (counter < this.fileDescriptors.length) {
      const fd = this.fileDescriptors[counter];
      console.debug("closing file descriptor " + counter.toString());
      fs.closeSync(fd);
      counter += 1;
    }
    */
  }

  removePidfile() {
    if (this.pidfilePath) {
      console.log(`Removing ${this.pidfilePath}`);
      removeSync(this.pidfilePath);
      this.pidfilePath = undefined;
    }
  }

  getFilenameFromErrorMessage(errorMessage: string): string {
    // The errorMessage must contain the filename within single quotes
    // and looks like this:
    // Error: UNKNOWN: unknown error, lstat 'c:\Users\Test\Programming\MyProject'
    let quoteStartIndex = errorMessage.indexOf(`'`);
    let quoteEndIndex = errorMessage.indexOf(`'`, quoteStartIndex + 1);
    return errorMessage.substring(quoteStartIndex + 1, quoteEndIndex);
  }

  isError(error: unknown, code: string): boolean {
    const err = error as NodeJS.ErrnoException;
    return err.code === code;
  }

  async watcherErrorFunction(error: Error) {
    if (this.watcher && this.isError(error, 'ENOSPC')) {
      console.warn(error.stack);
      console.warn('Will disable file watching. File polling will stay enabled.');
      await this.watcher?.close();
      this.watcher = undefined;
      console.warn('File watching disabled.');
      Telemetry.sendEvent({
        name: `index:watcher_error:enospc`,
        properties: {
          errorMessage: error.message,
          errorStack: error.stack,
        },
      });
    } else if (this.isError(error, 'UNKNOWN') && error.message.includes('lstat')) {
      console.warn(error.stack);
      Telemetry.sendEvent({
        name: `index:watcher_error:unknown`,
        properties: {
          errorMessage: error.message,
          errorStack: error.stack,
        },
      });
      const filename = this.getFilenameFromErrorMessage(error.message);
      this.unreadableFiles.add(filename);
      console.warn('Will not read this file again.');
    } else if (this.isError(error, 'EMFILE')) {
      // Don't crash if too many files are open. When the files close
      // the indexer will pick them up.
      console.warn(error.stack);
      Telemetry.sendEvent({
        name: `index:watcher_error:emfile`,
        properties: {
          errorMessage: error.message,
          errorStack: error.stack,
        },
      });
    } else {
      // let it crash if it's some other error, to learn what the error is
      throw error;
    }
  }

  // Custom ignore function needed to skip unreadableFiles because
  // attempting to read them can block reading all files. It also
  // cuts down the watch tree to just what we need.
  ignored(targetPath: string) {
    ['/node_modules/', '/.git/'].forEach((pattern) => {
      if (targetPath.includes(pattern)) {
        return true;
      }
    });

    if (this.unreadableFiles.has(targetPath)) {
      return true;
    }

    // Also make sure to not try to recurse down node_modules or .git
    const basename = path.basename(targetPath);
    return basename === 'node_modules' || basename === '.git';
  }

  async execute() {
    this.fpQueue.process().then(() => {
      this.fpQueue.handler.checkVersion = false;
    });

    const glob = `${this.directory}/**/*.appmap.json`;

    this.poller = new Globber(glob)
      .on('add', this.added.bind(this))
      .on('change', this.changed.bind(this))
      .on('unlink', this.removed.bind(this));

    const pollReady = new Promise<void>((r) => this.poller?.once('end', r));
    this.poller.start();
    await pollReady;

    this.watcher = watch(glob, {
      ignoreInitial: true,
      ignored: this.ignored.bind(this),
      ignorePermissionErrors: true,
    })
      .on('add', this.added.bind(this))
      .on('change', this.changed.bind(this))
      .on('unlink', this.removed.bind(this))
      .on('error', this.watcherErrorFunction.bind(this));

    const watchReady = new Promise<void>((r) => this.watcher?.once('ready', r));

    await Promise.all([pollReady, watchReady]);

    this.ready();
  }

  async close() {
    await Promise.all([this.watcher, this.poller].map((ch) => ch?.close()));
    this.removePidfile();
    this.watcher = undefined;
    this.poller = undefined;
  }

  added(file: string) {
    if (verbose()) {
      console.warn(`AppMap added: ${file}`);
    }
    this.enqueue(file);
  }

  changed(file: string) {
    if (verbose()) {
      console.warn(`AppMap changed: ${file}`);
    }
    this.enqueue(file);
  }

  removed(file: string) {
    console.warn(`TODO: AppMap removed: ${file}`);
  }

  ready() {
    if (this.pidfilePath) {
      outputFileSync(this.pidfilePath, `${process.pid}`);
      process.on('exit', this.removePidfile.bind(this));
    }
    if (verbose()) {
      console.warn(`Watching appmaps in ${resolve(process.cwd(), this.directory)}`);
    }
  }

  enqueue(file: string) {
    // This shouldn't be necessary, but it's passing through the wrong file names.
    if (!file.includes('.appmap.json')) {
      return;
    }
    this.fpQueue.push(file);
  }

  private sendTelemetry(metadata: Metadata[]) {
    const properties = Object.fromEntries(
      intersectMaps(...metadata.map(flattenMetadata)).entries()
    );
    Telemetry.sendEvent({
      name: 'appmap:index',
      properties,
      metrics: {
        appmaps: metadata.length,
      },
    });
  }
}
