const { resolve } = require("path");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

const getTrackedFiles = async ({ cwd }) => {
  const {
    stdout,
    stderr,
  } = await exec(`git status --short --untracked-files=all`, { cwd });
  if (stderr) throw new Error(stderr);
  return stdout
    .split("\n")
    .filter(Boolean)
    .map((fp) => resolve(cwd, fp.replace(/^.{2} /, "")));
};

exports.getTrackedFiles = getTrackedFiles;
