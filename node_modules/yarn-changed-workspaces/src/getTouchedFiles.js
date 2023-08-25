const { resolve } = require("path");
const { format } = require("util");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

const getTouchedFiles = async ({ branch, cwd }) => {
  const cmd = format(`git diff --name-only %s`, branch);
  const { stdout, stderr } = await exec(cmd, { cwd });
  if (stderr) throw new Error(stderr);
  return stdout
    .split("\n")
    .filter(Boolean)
    .map((changedFilePath) => resolve(cwd, changedFilePath));
};

exports.getTouchedFiles = getTouchedFiles;
