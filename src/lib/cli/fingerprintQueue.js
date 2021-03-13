const { queue } = require('async');
const Fingerprinter = require('./fingerprinter');

class FingerprintQueue {
  constructor(size = 5, printCanonicalAppMaps = true) {
    this.size = size;
    // eslint-disable-next-line no-use-before-define
    this.handler = new Fingerprinter(printCanonicalAppMaps);
    this.queue = queue(this.handler.fingerprint.bind(this.handler), this.size);
    this.queue.pause();
  }

  async process() {
    return new Promise((resolve, reject) => {
      this.queue.drain(resolve);
      this.queue.error(reject);
      this.queue.resume();
    });
  }

  push(job) {
    this.queue.push(job);
  }
}

module.exports = FingerprintQueue;
