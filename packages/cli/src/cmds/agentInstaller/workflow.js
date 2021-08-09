/* eslint-disable max-classes-per-file */
// @ts-check

const readline = require('readline');

const AbortError = require('./abortError');

const QUERY = "Press enter to continue, 'a' abort";
const MANUAL_QUERY =
  "Press enter to continue, 'a' abort, or 'm' to run it yourself manually: ";
class Step {
  constructor(prompt, action, query = QUERY) {
    this.prompt = prompt;
    this.query = query;
    this.action = action;
  }

  run() {
    console.warn(this.prompt);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve, reject) =>
      rl.question(this.query, (answer) => {
        rl.close();
        if (answer === 'a') {
          reject(new AbortError());
        }
        resolve(answer);
      })
    ).then(this.action);
  }
}

class ManualStep extends Step {
  constructor(prompt, action) {
    super(prompt, action, MANUAL_QUERY);
  }
}

class Workflow {
  constructor(installer, steps, path) {
    this.buildToolInstaller = installer;
    this.steps = steps;
    this.path = path;
  }

  async run() {
    // eslint-disable-next-line no-plusplus
    for (let idx = 0; idx < this.steps.length; idx++) {
      // eslint-disable-next-line no-await-in-loop
      await this.steps[idx].run();
    }
  }
}

module.exports = { ManualStep, Step, Workflow };
