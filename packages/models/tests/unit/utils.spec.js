import { isLocalPath } from '../../src/util';

const Examples = {
  'index.js': false,
  'index.js:12': true,
  './index.js': true,
  './index.js:10': true,
  'src/index.js': true,
  './src/index.js': true,
  '.\\src/index.js': true,
  '/tmp/index.js': false,
  'c:/tmp/index.js': false,
  'c:\\tmp\\index.js': false,
  './vendor/index.js': false,
  'vendor/index.js': false,
  '<internal:pack>': false,
  '<internal:pack>:302': false,
};

describe('isLocalPath', () => {
  for (const [path, expected] of Object.entries(Examples)) {
    it(`${path} ${expected ? 'should' : 'should not'} be local`, () => {
      expect(isLocalPath(path, ['vendor']).isLocal).toEqual(expected);
    });
  }
});
