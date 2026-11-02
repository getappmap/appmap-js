import Ajv2020 from 'ajv/dist/2020';
import { appMapComparisonSchema, validateAppMapComparison } from '@appland/models';
import { readFileSync } from 'fs';
import { join } from 'path';
const dir = join(__dirname, '../../../../models/schema/conformance');
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as {
  file: string;
  structural: boolean;
  semantic: boolean;
}[];
const check = new Ajv2020({ strict: false, allErrors: true }).compile(appMapComparisonSchema);
describe('Given the portable conformance manifest', () => {
  it.each(manifest)(
    'When $file is checked Then structural=$structural and semantic=$semantic',
    (entry) => {
      const data: unknown = JSON.parse(readFileSync(join(dir, entry.file), 'utf8'));
      expect(Boolean(check(data))).toBe(entry.structural);
      expect(validateAppMapComparison(data).length === 0).toBe(entry.semantic);
    }
  );
});
