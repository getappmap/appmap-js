const { getTouchedFiles } = require("./getTouchedFiles");
const { getTrackedFiles } = require("./getTrackedFiles");

const getChangedFiles = async ({ branch, cwd } = {}) => {
  const [touchedFiles, trackedFiles] = await Promise.all([
    getTouchedFiles({ cwd, branch }),
    getTrackedFiles({ cwd }),
  ]);
  return [...new Set([...touchedFiles, ...trackedFiles])];
};

exports.getChangedFiles = getChangedFiles;
