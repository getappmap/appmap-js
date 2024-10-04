import { buildExclusionPattern } from '../../../../src/rpc/explain/collectContext';

describe('Regex patterns', () => {
  const EXCLUDE_DOT_APPMAP_DIR = buildExclusionPattern('.appmap');
  const EXCLUDE_DOT_NAVIE_DIR = buildExclusionPattern('.navie');

  const testCases = [
    { path: '/path/to/.appmap/file', pattern: EXCLUDE_DOT_APPMAP_DIR, shouldMatch: true },
    { path: '/path/.hidden/.appmap/file', pattern: EXCLUDE_DOT_APPMAP_DIR, shouldMatch: true },
    { path: '/path/to/appmap/file', pattern: EXCLUDE_DOT_APPMAP_DIR, shouldMatch: false },
    { path: '.appmap', pattern: EXCLUDE_DOT_APPMAP_DIR, shouldMatch: true },
    { path: '/appmap/.appmap/', pattern: EXCLUDE_DOT_APPMAP_DIR, shouldMatch: true },
    { path: '/path/to/.navie/file', pattern: EXCLUDE_DOT_NAVIE_DIR, shouldMatch: true },
    { path: '/path/.hidden/.navie/file', pattern: EXCLUDE_DOT_NAVIE_DIR, shouldMatch: true },
    { path: '/path/to/navie/file', pattern: EXCLUDE_DOT_NAVIE_DIR, shouldMatch: false },
    { path: '.navie', pattern: EXCLUDE_DOT_NAVIE_DIR, shouldMatch: true },
    { path: '_.navie', pattern: EXCLUDE_DOT_NAVIE_DIR, shouldMatch: false },
    { path: '._navie', pattern: EXCLUDE_DOT_NAVIE_DIR, shouldMatch: false },
    { path: '/navie/.navie/', pattern: EXCLUDE_DOT_NAVIE_DIR, shouldMatch: true },
    { path: '/non-matching/test/file', pattern: /some_other_regex/, shouldMatch: false },
  ];

  testCases.forEach(({ path, pattern, shouldMatch }) => {
    it(`should ${shouldMatch ? '' : 'not '}match pattern for path: ${path}`, () => {
      expect(pattern.test(path)).toEqual(shouldMatch);
    });
  });
});
