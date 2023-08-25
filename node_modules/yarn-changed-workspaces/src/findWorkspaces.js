const { join } = require("path");
const { promises: fs } = require("fs");
const { readJSONFile } = require("./readJSONFile");
const { promisify } = require("util");

const _glob = require("glob");
const glob = promisify(_glob);

const findWorkspaces = async ({ rootPath, pattern }) => {
  const workspaces = [];
  const globPath = join(rootPath, pattern);
  const matched = await glob(globPath);
  await Promise.all(
    matched.map(async (path) => {
      const stat = await fs.stat(path);
      if (!stat.isDirectory()) return;
      const pkgPath = join(path, "package.json");
      const pkg = await readJSONFile(pkgPath);
      workspaces.push({
        id: pkg.name,
        path,
        config: pkg.workspace,
        dependencies: Object.keys({
          ...pkg.dependencies,
          ...pkg.devDependencies,
          ...pkg.peerDependencies,
          ...pkg.bundledDependencies,
          ...pkg.optionalDependencies,
        }),
      });
    })
  );
  return workspaces;
};
exports.findWorkspaces = findWorkspaces;
