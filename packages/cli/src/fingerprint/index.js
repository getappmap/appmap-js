const { algorithms, canonicalize } = require('./canonicalize');
const FingerprintDirectoryCommand = require('./fingerprintDirectoryCommand');
const FingerprintWatchCommand = require('./fingerprintWatchCommand').default;

async function fingerprintDirectory(dir, watch = false) {
  let cmd;
  if (watch) {
    cmd = new FingerprintWatchCommand(dir);
  } else {
    cmd = new FingerprintDirectoryCommand(dir);
  }
  return cmd.execute();
}

module.exports = {
  algorithms,
  canonicalize,
  fingerprintDirectory,
};
