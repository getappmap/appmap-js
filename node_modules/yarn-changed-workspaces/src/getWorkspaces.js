const { resolve } = require("path");
const { readJSONFile } = require("./readJSONFile");
const { findWorkspaces } = require("./findWorkspaces");
const { keyById } = require("./keyById");

const getWorkspaces = async (rootPath) => {
  const pkgPath = resolve(rootPath, "package.json");
  const pkg = await readJSONFile(pkgPath);
  const patterns =
    (Array.isArray(pkg.workspaces)
      ? pkg.workspaces
      : pkg.workspaces.packages) || [];
  const workspaces = await Promise.all(
    patterns.map(async (pattern) => findWorkspaces({ pattern, rootPath }))
  );
  return workspaces.flat().reduce(keyById, {});
};

module.exports.getWorkspaces = getWorkspaces;
