const posix = require('posix');

import * as increaseFileLimitLib from '../../../src/lib/increaseFileLimit';


describe('increaseFileLimit', () => {

    it(`increaseFileLimitTo works the first time`, async () => {
        jest.clearAllMocks();
        const spySetRlimit = jest.spyOn(posix, 'setrlimit').mockReturnValue(true);
        increaseFileLimitLib.increaseFileLimit();
        expect(spySetRlimit).toBeCalledTimes(1);
    });
 
    it(`increaseFileLimit works with multiple calls to increaseFileLimitTo`, async () => {
        jest.clearAllMocks();
        const spySetRlimit = jest.spyOn(posix, 'setrlimit')
        .mockImplementationOnce( () => {
            throw new Error("EPERM, Operation not permitted");
        })
        .mockImplementationOnce( () => {
            throw new Error("EPERM, Operation not permitted");
        })
        .mockReturnValue(true);
        increaseFileLimitLib.increaseFileLimit();
        expect(spySetRlimit).toBeCalledTimes(3);
      });
})
