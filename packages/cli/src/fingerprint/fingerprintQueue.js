const { queue } = require('async');
const { default: FileTooLargeError } = require('./fileTooLargeError');
const Fingerprinter = require('./fingerprinter');

class FingerprintQueue {
  constructor(size = 5, printCanonicalAppMaps = true) {
    this.size = size;
    // eslint-disable-next-line no-use-before-define
    this.handler = new Fingerprinter(printCanonicalAppMaps);
    this.queue = queue(this.handler.fingerprint.bind(this.handler), this.size);
    this.queue.pause();
  }

  setCounterFn(counterFn) {
    this.handler.setCounterFn(counterFn);
  }

  async process() {
    return new Promise((resolve, reject) => {
      this.queue.drain(resolve);
      this.queue.error((error) => {
        if (error instanceof FileTooLargeError) {
          console.warn(
            [
              `Skipped: ${error.message}`,
              'Tip: consider recording a shorter interaction or removing some classes from appmap.yml.',
            ].join('\n')
          );
        } else if (error.code === 'ENOENT') {
          console.warn(`Skipped: ${error.path}\nThe file does not exist.`);
        } else reject(error);
      });
      this.queue.resume();
    });
  }

  push(job) {
    this.queue.push(job);
  }
}

module.exports = FingerprintQueue;
