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

  toString() {
    return [this.program].concat(this.args).join(' ');
  }
}

module.exports = CommandStruct;
