import { buildAppMap } from '@appland/models';
import { promises as fs } from 'fs';
import * as path from 'path';
import Specification, { CodeObjectId } from '../../src/specification';

interface SpecificationInternal {
  includedCodeObjectIds: Set<CodeObjectId>;
}

describe('Specification', () => {
  it('includes all relevant actors', async () => {
    const appMapPath = path.join(
      __dirname,
      '..',
      'fixtures',
      'appmaps',
      'org_springframework_sample.appmap.json'
    );
    const appMapData = await fs.readFile(appMapPath, 'utf8');
    const appMap = buildAppMap(appMapData).normalize().build();
    const subject = Specification.build(appMap, {}) as unknown as SpecificationInternal;

    expect([...subject.includedCodeObjectIds]).toEqual([
      'package:org/springframework',
      'package:org/springframework/samples/petclinic/model',
      'package:org/springframework/samples/petclinic/vet',
    ]);
  });
});
