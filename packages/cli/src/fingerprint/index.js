const { verbose } = require('../utils');
const { algorithms, canonicalize } = require('./canonicalize');
const FingerprintDirectoryCommand = require('./fingerprintDirectoryCommand');
const FingerprintWatchCommand = require('./fingerprintWatchCommand');

async function fingerprintDirectory(dir, watch = false, print = true) {
  if (verbose) {
    verbose(true);
  }

  let cmd;
  if (watch) {
    cmd = new FingerprintWatchCommand(dir);
  } else {
    cmd = new FingerprintDirectoryCommand(dir);
  }
  if (print) {
    cmd.setPrint(true);
  }
  return cmd.execute();
}

module.exports = {
  algorithms,
  canonicalize,
  fingerprintDirectory,
};
