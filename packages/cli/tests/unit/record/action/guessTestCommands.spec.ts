import sinon from 'sinon';
import { constants as fsConstants, promises as fsp } from 'fs';

import * as configuration from '../../../../src/cmds/record/configuration';
import guessTestCommands from '../../../../src/cmds/record/action/guessTestCommands';

describe('record.action.guessTestCommands', () => {
  afterEach(() => sinon.restore());

  describe('ruby', () => {
    beforeEach(() => {
      sinon
        .stub(configuration, 'readConfigOption')
        .withArgs('language', 'undefined')
        .resolves('ruby');
    });

    describe('when test path exists', () => {
      it('provides test command', async () => {
        const stubAccess = sinon.stub(fsp, 'access');
        stubAccess.withArgs('Gemfile/spec', fsConstants.R_OK).resolves();
        stubAccess.rejects();

        const testCommands = await guessTestCommands();
        expect(testCommands).toEqual([
          {
            env: { APPMAP: 'true', DISABLE_SPRING: 'true' },
            command: 'bundle exec rspec',
          },
        ]);
      });
    });
    describe('without test dirs', () => {
      it('provides no commands commands', async () => {
        sinon.stub(fsp, 'access').rejects();
        
        const testCommands = await guessTestCommands();
        expect(testCommands).toEqual([]);
      });
    });
  });
});
