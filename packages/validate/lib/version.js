const { readdirSync } = require("fs");

const path = `${__dirname}/../schema/`;

exports.getVersionMapping = () =>
  new Map(
    readdirSync(path).flatMap((filename) => {
      const match = /^(?<major>[0-9]+)-(?<minor>[0-9]+)-(?<patch>[0-9]+)\.yml$/u.exec(filename);
      if (match === null) {
        return [];
      }
      const { major, minor, patch } = match.groups;
      return [[`${major}.${minor}.${patch}`, `${path}${filename}`]];
    })
  );
