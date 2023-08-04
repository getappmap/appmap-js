import { copyFile } from 'fs/promises';
import { basename, join } from 'path';
import tmp from 'tmp';
import FindCodeObjects from '../../../src/search/findCodeObjects';
import { indexDirectory, stripCodeObjectParents } from '../util';

const checkoutDataFile = join(
  __dirname,
  '../fixtures/externalService/checkout_update_payment.appmap.json'
);

const appMapDir = tmp.dirSync().name.replace(/\\/g, '/');

describe('FindCodeObjects', () => {
  beforeAll(async () => {
    await copyFile(checkoutDataFile, join(appMapDir, basename(checkoutDataFile)));
    await indexDirectory(appMapDir);
  });
  it('finds external-service', async () => {
    const fn = new FindCodeObjects(appMapDir, 'external-service:%r{.*}');
    const result = await fn.find();
    expect(JSON.stringify(stripCodeObjectParents(result), null, 2)).toEqual(
      JSON.stringify(
        [
          {
            appmap: join(appMapDir, 'checkout_update_payment'),
            codeObject: {
              type: 'external-service',
              name: 'api.stripe.com',
              fqid: 'external-service:api.stripe.com',
            },
          },
        ],
        null,
        2
      )
    );
  });
  it('finds external-route', async () => {
    const fn = new FindCodeObjects(appMapDir, 'external-route:%r{.*}');
    const result = await fn.find();
    expect(JSON.stringify(stripCodeObjectParents(result), null, 2)).toEqual(
      JSON.stringify(
        [
          {
            appmap: join(appMapDir, 'checkout_update_payment'),
            codeObject: {
              type: 'external-route',
              name: 'POST https://api.stripe.com/v1/customers',
              fqid: 'external-route:POST https://api.stripe.com/v1/customers',
            },
          },
        ],
        null,
        2
      )
    );
  });
});
