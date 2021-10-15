import { readFileSync } from 'fs';
import { join } from 'path';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _secretsRegexes from './secretsRegexesData.json'; // import directly to include json file into the build

const regexData: { [key: string]: string | string[] } = JSON.parse(
  readFileSync(join(__dirname, 'secretsRegexesData.json')).toString()
);

const REGEXES: { [key: string]: RegExp[] } = Object.keys(regexData).reduce((memo, key) => {
  const value = regexData[key];
  const regexes = Array.isArray(value) ? value : [value];
  memo[key] = regexes.map((regex) => new RegExp(regex));
  return memo;
}, {} as { [key: string]: RegExp[] });

export default REGEXES;
