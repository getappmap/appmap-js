let isVerbose = false;
function verbose(v = null) {
  if (v !== null) {
    isVerbose = v;
  }
  return isVerbose;
}

module.exports = { verbose };
