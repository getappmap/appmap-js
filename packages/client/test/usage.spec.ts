import nock from 'nock';
import './setup';
import { Usage } from '../src';
import Sinon from 'sinon';
import * as config from '../src/loadConfiguration';
import { ApiKey } from './setup';

describe('Usage', () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  const addDays = (date: Date, days: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
  };

  const usageReport = {
    events: {
      usage: 0,
      limit: 10000,
    },
    cycleStart: new Date().toISOString(),
    cycleEnd: addDays(new Date(), 30).toISOString(),
  };

  beforeEach(() => {
    Sinon.restore();
    Sinon.stub(config, 'default').returns({
      baseURL: config.DefaultURL,
      apiURL: 'http://localhost:3000',
      apiKey: ApiKey,
    });
  });

  describe('get', () => {
    it('issues an expected API call', () => {
      nock('http://localhost:3000')
        .get('/v1/usage')
        .matchHeader('authorization', `Bearer ${ApiKey}`)
        .reply(200, usageReport);
      return expect(Usage.get()).resolves.toEqual(usageReport);
    });

    it('throws an error when the API returns an error', () => {
      const orgId = 1;
      const message = 'something is missing';
      nock('http://localhost:3000')
        .get('/v1/usage')
        .matchHeader('authorization', `Bearer ${ApiKey}`)
        .reply(404, { statusCode: 404, message });
      return expect(Usage.get()).rejects.toThrow(message);
    });
  });

  describe('update', () => {
    it('issues an expected API call', () => {
      const events = 128;
      const appmaps = 256;
      const contributors = 512;
      const metadata = { foo: 'bar' };
      const dto = { events, appmaps, contributors, metadata };
      const dtoWithStringMetadata = { ...dto, metadata: JSON.stringify(metadata) };
      nock('http://localhost:3000')
        .post('/v1/usage', dtoWithStringMetadata)
        .matchHeader('authorization', `Bearer ${ApiKey}`)
        .reply(201);
      return expect(Usage.update(dto as any)).resolves.toBeUndefined();
    });

    it('throws an error when the API returns an error', () => {
      const message = 'something awful happened';
      nock('http://localhost:3000').post('/v1/usage').replyWithError(message);
      return expect(Usage.update({ events: 1 })).rejects.toThrow(message);
    });
  });
});
