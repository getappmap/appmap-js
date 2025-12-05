const FileSystem = require('fs');
const Semver = require('semver');
const YAML = require('yaml');

const lines = FileSystem.readFileSync(`${__dirname}/macro.yml`, 'utf8').split('\n');

const versions = ['1.13.1', '1.13.0', '1.12.0', '1.11.0', '1.10.0', '1.9.0', '1.8.0', '1.7.0', '1.6.0', '1.5.1', '1.5.0', '1.4.1', '1.4.0', '1.3.0', '1.2.0'];

for (const version of versions) {
  const yaml = lines
    .flatMap((line) => {
      const match = /^(?<consequent>.*)#! (?<condition>.*)$/u.exec(line);
      if (match === null) {
        return [line];
      }
      const { condition, consequent } = match.groups;
      return Semver.satisfies(version, condition) ? [consequent.trimEnd()] : [];
    })
    .join('\n');
  FileSystem.writeFileSync(
    `${__dirname}/../schema/${version.replace(/\./g, '-')}.js`,
    `exports.schema = ${JSON.stringify(YAML.parse(yaml), null, 2)};`,
    'utf8'
  );
}
