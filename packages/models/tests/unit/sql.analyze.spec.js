import analyze from '../../src/sql/analyze';
import { join } from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const examplePath = join(fileURLToPath(import.meta.url), '../fixtures/sql/sql_examples.json');

const Examples = JSON.parse(readFileSync(examplePath, 'utf8'));

describe('analyze SQL', () => {
  Examples.forEach((example) => {
    test(example.name, () => {
      const analyzed = analyze(example.sql);
      expect(analyzed).toEqual(example.analyzed);
    });
  });
});
