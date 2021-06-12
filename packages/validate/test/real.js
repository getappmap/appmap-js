const { readdirSync } = require("fs");
const { validate } = require("../lib/main.js");

for (let filename of readdirSync(`${__dirname}/valid`)) {
  validate({ path: `${__dirname}/valid/${filename}` });
}
