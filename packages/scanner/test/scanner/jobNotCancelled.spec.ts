import JobNotCancelled from '../../src/scanner/jobNotCancelled';
import type { AssertionPrototype } from '../../src/types';
import { scan } from '../util';

test('job not cancelled scanner', async () => {
  const prototype: AssertionPrototype = {
    config: { id: JobNotCancelled.scanner().id },
    build: JobNotCancelled.scanner,
    enumerateScope: false,
    scope: 'transaction',
  };
  const findings = await scan(
    prototype,
    'Microposts_interface_micropost_interface_with_job.appmap.json'
  );
  expect(findings).toHaveLength(1);
});
