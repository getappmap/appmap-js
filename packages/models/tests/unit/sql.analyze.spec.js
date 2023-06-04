import analyze from '../../src/sql/analyze';
import Examples from './fixtures/sql/sql_examples.json';

describe('analyze SQL', () => {
  Examples.forEach((example) => {
    test(example.name, () => {
      const analyzed = analyze(example.sql);
      expect(analyzed).toEqual(example.analyzed);
    });
  });
});
