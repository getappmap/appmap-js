import nock, { RequestBodyMatcher } from 'nock';

import * as test from './setup';
import { create, CreateOptions } from '../../src/integration/appland/appMap/create';
import { Metadata } from '@appland/models';
import assert from 'assert';

const AppMapData = {
  uuid: 'the-uuid',
};

interface TestOptions {
  data?: Buffer;
  app?: string;
  metadata?: Metadata;
  requestBodyHandler?: (body: RequestBodyMatcher) => boolean;
}

async function createAppMap(options: TestOptions): Promise<void> {
  const data = options.data || Buffer.from(JSON.stringify({}));
  const createOptions = {
    app: options.app || test.AppId,
    metadata: options.metadata,
  };

  nock('http://localhost:3000')
    .post(`/api/appmaps`, options.requestBodyHandler)
    .matchHeader(
      'Authorization',
      'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
    )
    .matchHeader('Content-Type', /^multipart\/form-data; boundary/)
    .matchHeader('Accept', /^application\/json;?/)
    .reply(201, AppMapData, ['Content-Type', 'application/json']);
  expect(await create(data, createOptions)).toEqual(AppMapData);
}

describe('appMap', () => {
  describe('create', () => {
    it('succeeds', async () => {
      await createAppMap({
        metadata: { name: 'example' } as Metadata,
        requestBodyHandler(body: RequestBodyMatcher) {
          expect(body).toMatch(/Content-Disposition: form-data; name="data"/);
          expect(body).toMatch(/Content-Disposition: form-data; name="metadata"/);
          return true;
        },
      });
    });

    it('succeeds with null metadata', async () => {
      await createAppMap({
        requestBodyHandler(body: RequestBodyMatcher) {
          expect(body).toMatch(/Content-Disposition: form-data; name="data"/);
          expect(body).not.toMatch(/Content-Disposition: form-data; name="metadata"/);
          return true;
        },
      });
    });
  });

  describe('with a 503 error', () => {
    it('succeeds after retry', async () => {
      nock('http://localhost:3000')
        .post(`/api/appmaps`)
        .matchHeader(
          'Authorization',
          'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
        )
        .reply(503);

      nock('http://localhost:3000')
        .post(`/api/appmaps`)
        .matchHeader(
          'Authorization',
          'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
        )
        .reply(201, AppMapData, ['Content-Type', 'application/json']);

      expect(
        await create(Buffer.from(JSON.stringify({})), { retryDelay: 0, maxRetries: 1 })
      ).toEqual(AppMapData);
    });
  });

  describe('with repeated 503 errors', () => {
    it('fails', async () => {
      nock('http://localhost:3000')
        .post(`/api/appmaps`)
        .times(2)
        .matchHeader(
          'Authorization',
          'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
        )
        .reply(503);

      create(Buffer.from(JSON.stringify({})), { retryDelay: 0, maxRetries: 1 })
        .then(() => {
          assert('AppMap creation should have failed');
        })
        .catch(() => (err: Error) => {
          expect(err.message).toEqual('Unable to create AppMap: Max retries exceeded');
        });
    });
  });
});
