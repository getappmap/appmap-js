const yargs = require('yargs');

const {
  cmdHandler,
} = require('../../src/cmds/configValidator/validate-config');

const logger = {
  log: () => {},
  error: () => {},
};

describe('validate-config command', () => {
  it('returns 0 when validation succeeds', async () => {
    const svc = {
      validateConfig: () => ({ valid: true }),
    };

    const ret = await cmdHandler(null, null, null, svc, logger);
    expect(ret).toEqual(0);
  });

  it('returns non-zero when validation fails', async () => {
    const svc = {
      validateConfig: () => ({ valid: false }),
    };

    const ret = await cmdHandler(null, null, null, svc, logger);
    expect(ret).not.toEqual(0);
  });

  const parser = (newYargs) =>
    newYargs
      // eslint-disable-next-line global-require
      .command(require('../../src/cmds/configValidator/validate-config'))
      .demandOption('projecttype')
      .exitProcess(false);

  ['python', 'ruby'].forEach((p) => {
    const projectType = p;
    it(`fails to validate ${projectType} projects`, () => {
      const newYargs = yargs();
      expect(() => {
        parser(newYargs).parse(`validate-config ${projectType}`);
      }).toThrow(/Only Java projects can currently be validated./);
    });
  });
  it('will validate Java projects', () => {
    expect(() => parser(yargs()).parse('validate-config java')).not.toThrow();
  });
});
