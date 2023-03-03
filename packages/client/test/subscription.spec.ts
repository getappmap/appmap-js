import nock from 'nock';
import './setup';
import { Subscription, SubscriptionEntity, SubscriptionFeature } from '../src';
import Sinon from 'sinon';
import * as config from '../src/loadConfiguration';
import { ApiKey } from './setup';

describe('subscriptions', () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  beforeEach(Sinon.restore);

  describe('get', () => {
    function expectEmpty(sub?: Subscription) {
      expect(sub).toBeDefined();
      expect(sub?.features).toBeUndefined();
      expect(sub?.entities).toBeUndefined();
      expect(sub?.expiresAt).toBeUndefined();
      expect(sub?.active).toBe(false);
      expect(sub?.authentic).toBe(false);
      [SubscriptionFeature.OpenApi, SubscriptionFeature.Analysis].forEach((feature) => {
        expect(sub?.entitledTo(feature)).toBe(false);
      });
      [SubscriptionEntity.User, SubscriptionEntity.System].forEach((entity) => {
        expect(sub?.hasSeatType(entity)).toBe(false);
      });
    }

    it('has expected outputs with an active subscription', async () => {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      nock('http://localhost:3000')
        .get('/api/subscriptions')
        .reply(200, {
          features: [SubscriptionFeature.OpenApi, SubscriptionFeature.Analysis],
          entities: [SubscriptionEntity.User, SubscriptionEntity.System],
          expires_at: nextMonth.toISOString(),
        });

      const sub = await Subscription.get();
      expect(sub).toBeDefined();
      expect(sub?.features).toEqual([SubscriptionFeature.OpenApi, SubscriptionFeature.Analysis]);
      [SubscriptionFeature.OpenApi, SubscriptionFeature.Analysis].forEach((feature) => {
        expect(sub?.entitledTo(feature)).toBe(true);
      });
      [SubscriptionEntity.User, SubscriptionEntity.System].forEach((entity) => {
        expect(sub?.hasSeatType(entity)).toBe(true);
      });
      expect(sub?.entities).toEqual([SubscriptionEntity.User, SubscriptionEntity.System]);
      expect(sub?.expiresAt).toBeInstanceOf(Date);
      expect(sub?.active).toBe(true);
      expect(sub?.authentic).toBe(false);
    });

    it('has expected outputs with an inactive/restricted subscription', async () => {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      nock('http://localhost:3000')
        .get('/api/subscriptions')
        .reply(200, {
          features: [SubscriptionFeature.OpenApi],
          entities: [SubscriptionEntity.User],
          expires_at: monthAgo.toISOString(),
        });

      const sub = await Subscription.get();
      expect(sub).toBeDefined();
      expect(sub?.features).toEqual([SubscriptionFeature.OpenApi]);
      expect(sub?.entitledTo(SubscriptionFeature.OpenApi)).toBe(true);
      expect(sub?.entitledTo(SubscriptionFeature.Analysis)).toBe(false);
      expect(sub?.hasSeatType(SubscriptionEntity.User)).toBe(true);
      expect(sub?.hasSeatType(SubscriptionEntity.System)).toBe(false);
      expect(sub?.entities).toEqual([SubscriptionEntity.User]);
      expect(sub?.expiresAt).toBeInstanceOf(Date);
      expect(sub?.active).toBe(false);
      expect(sub?.authentic).toBe(false);
    });

    it('reports as authentic when connected to app.land', async () => {
      Sinon.stub(config, 'default').returns({ baseURL: config.DefaultURL, apiKey: ApiKey });

      nock(config.DefaultURL)
        .get('/api/subscriptions')
        .reply(200, {
          features: [SubscriptionFeature.OpenApi],
          entities: [SubscriptionEntity.User],
          expires_at: new Date().toISOString(),
        });

      const sub = await Subscription.get();
      expect(sub?.authentic).toBe(true);
    });

    it('returns an empty subscription when not connected', async () => {
      nock('http://localhost:3000')
        .get('/api/subscriptions')
        .replyWithError('something awful happened');

      const sub = await Subscription.get();
      expectEmpty(sub);
    });

    it('returns an empty subscription when unauthenticated', async () => {
      nock('http://localhost:3000')
        .get('/api/subscriptions')
        .reply(401, { message: 'unauthorized' });

      const sub = await Subscription.get();
      expectEmpty(sub);
    });
  });

  describe('reportUsage', () => {
    it('adheres to the expected API', async () => {
      nock('http://localhost:3000')
        .post('/api/subscriptions/usage', {
          feature: SubscriptionFeature.OpenApi,
          entity: SubscriptionEntity.User,
          usage: { foo: 'bar' },
        })
        .reply(200, { message: 'ok' });

      await Subscription.reportUsage(SubscriptionFeature.OpenApi, SubscriptionEntity.User, {
        foo: 'bar',
      });
    });

    it("doesn't leak exceptions", async () => {
      nock('http://localhost:3000')
        .post('/api/subscriptions/usage')
        .replyWithError('something awful happened');

      await Subscription.reportUsage(SubscriptionFeature.OpenApi, SubscriptionEntity.User, {
        foo: 'bar',
      });
    });
  });
});
