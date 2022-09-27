const { verbose, listAppMapFiles } = require('../utils');
const FingerprintQueue = require('./fingerprintQueue').default;

class FingerprintDirectoryCommand {
  constructor(directory) {
    this.directory = directory;
    this.print = true;
  }

  async execute() {
    if (verbose()) {
      console.warn(`Fingerprinting appmaps in ${this.directory}`);
    }

    const fpQueue = new FingerprintQueue();
    let count = 0;
    await this.files((file) => {
      count += 1;
      return fpQueue.push(file);
    });
    await fpQueue.process();
    return count;
  }

  async files(fn) {
    return listAppMapFiles(this.directory, fn);
  }
}

module.exports = FingerprintDirectoryCommand;
