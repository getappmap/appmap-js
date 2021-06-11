#!/usr/bin/env node

const minimist = require("minimist");
const { InvalidAppmapError, InputError } = require("./assert.js");
const { validate } = require("./main.js");

const options = minimist(process.argv.slice(2));

const failure = (message) => {
  process.stderr.write(message);
  process.exitCode = 1;
};

const success = (message) => {
  process.stdout.write(message);
};

if (options._.length === 0) {
  failure(
    [
      "usage: node validate.js [--version=<version>] <target>\n",
      "  - version: appmap specification version -- eg: '1.6.0'\n",
      "  - target: path to appmap file -- eg: path/to/foo.appmap.json\n",
    ].join("")
  );
} else {
  try {
    validate({
      ...options,
      path: options._[0],
    });
    success("valid appmap\n");
  } catch (error) {
    if (!(error instanceof InputError) && !(error instanceof InvalidAppmapError)) {
      throw error;
    }
    failure(`${error.message}${"\n"}`);
  }
}
