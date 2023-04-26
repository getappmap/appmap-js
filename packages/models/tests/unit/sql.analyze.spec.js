import analyze from '../../src/sql/analyze';
import { join } from 'path';
import { readFileSync } from 'fs';

const Examples = JSON.parse(
  readFileSync(join(__dirname, './fixtures/sql/sql_examples.json'), 'utf8')
);

describe('analyze SQL', () => {
  Examples.forEach((example) => {
    test(example.name, async () => {
      const analyzed = analyze(example.sql);
      expect(analyzed).toEqual(example.analyzed);
    });
  });
});
