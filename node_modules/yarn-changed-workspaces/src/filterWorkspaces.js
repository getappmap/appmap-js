const { relative } = require("path");
const { all } = require("micromatch");

const filterWorkspaces = ({ workspace, files }) => {
  return files.filter((filePath) => {
    const { path, config = {} } = workspace;
    if (!filePath.startsWith(path)) return false;
    if (!config.files) return true;
    const relativePath = relative(path, filePath);
    return all(relativePath, config.files);
  });
};

exports.filterWorkspaces = filterWorkspaces;
