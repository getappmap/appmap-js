import RecordContext, {
  RecordProcessResult,
} from '../../../src/cmds/record/recordContext';
import * as countAppMaps from '../../../src/cmds/record/action/countAppMaps';
import sinon from 'sinon';
import TempConfig from './tempConfig';

describe('RecordContext', () => {
  let resultsStub: sinon.SinonStub;

  beforeEach(() => {
    sinon.stub(countAppMaps, 'default').resolves();
    resultsStub = sinon.stub(RecordContext.prototype, 'results');
  });
  afterEach(() => {
    sinon.restore();
  });

  describe('RecordProcessResult', () => {
    it('filters the environment variables in results', () => {
      const rpr = new RecordProcessResult(
        {
          APPMAP: 'true',
          APPMAP_API_KEY: 'deadbeef',
          MY_APPMAP_ENV_VAR: 'not one we recognize',
          COLUMNS: '128',
        },
        '/bin/true',
        0,
        ''
      );

      const actual = Object.keys(rpr.env);

      const expected = ['APPMAP'];
      for (const k of expected) {
        expect(actual).toContain(k);
      }

      const filteredKeys = ['APPMAP_API_KEY', 'MY_APPMAP_ENV_VAR', 'COLUMNS'];
      for (const k of filteredKeys) {
        expect(actual).not.toContain(k);
      }
    });
  });

  describe('counting failures', () => {
    beforeEach(() => {
      // Turn off RecordContext's precondition check that results are present, to make it easier to
      // test exitCodes.
      resultsStub.value([]);
    });

    [
      { codes: [], expectation: 0 },
      { codes: [0], expectation: 0 },
      { codes: [2], expectation: 1 },
      { codes: [0, 0], expectation: 0 },
      { codes: [0, 1], expectation: 1 },
    ].forEach((e) => {
      const { codes, expectation } = e;
      (e['fn'] || it)(`has exit codes ${JSON.stringify(codes)}`, () => {
        const ctx = new RecordContext(new TempConfig());
        sinon.stub(ctx, 'exitCodes').value(codes);
        expect(ctx.failures).toEqual(expectation);
      });
    });
  });
});
