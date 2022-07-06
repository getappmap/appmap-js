const { readdirSync, readFileSync } = require('fs');
const { validate } = require('../lib/index.js');

const directory = `${__dirname}/valid`;

for (let filename of readdirSync(directory)) {
  validate(JSON.parse(readFileSync(`${directory}/${filename}`, 'utf8')));
}
