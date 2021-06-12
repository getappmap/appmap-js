const FileSystem = require("fs");
const Semver = require("semver");

const lines = FileSystem.readFileSync(`${__dirname}/macro.yml`, "utf8").split("\n");

const versions = [
  "1.6.0",
  "1.5.1",
  "1.5.0",
  "1.4.1",
  "1.4.0",
  "1.3.0",
  "1.2.0",
];

const dash = (version) => version.replace();

for (const version of versions) {
  FileSystem.writeFileSync(
    `${__dirname}/../schema/${version.replace(/\./g, "-")}.yml`,
    lines.flatMap((line) => {
      const match = /^(?<consequent>.*)#! (?<condition>.*)$/u.exec(line);
      if (match === null) {
        return [line];
      }
      const {condition, consequent} = match.groups;
      return Semver.satisfies(version, condition) ? [consequent.trimEnd()] : [];
    }).join("\n"),
    "utf8",
  );
}
