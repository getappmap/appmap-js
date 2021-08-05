// @ts-check

class CommandStruct {
  /**
   *
   * @param {string} program
   * @param {string[]} args
   * @param {NodeJS.ProcessEnv} environment
   */
  constructor(program, args, environment) {
    this.program = program;
    this.args = args;
    this.environment = environment;
  }
}

module.exports = CommandStruct;
