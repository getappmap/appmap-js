const { throws: assertThrow } = require('node:assert');
const { readdirSync, readFileSync } = require('fs');
const { validate } = require('../lib/index.js');

for (let filename of readdirSync(`${__dirname}/valid`)) {
  validate(JSON.parse(readFileSync(`${__dirname}/valid/${filename}`, 'utf8')));
}

for (let filename of readdirSync(`${__dirname}/invalid`)) {
  assertThrow(() => validate(JSON.parse(readFileSync(`${__dirname}/invalid/${filename}`, 'utf8'))));
}
