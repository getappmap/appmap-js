import { ConversationThread, SubscriptionItem } from '@appland/client';

import {
  checkProxyPermissions,
  checkSubscription,
  EnrollmentStatus,
  FREE_USAGE_LIMIT,
} from '../../../../src/rpc/explain/enroll-conversation';

describe('checkProxyPermissions', () => {
  function createThreadWithPermissions(useNavieAIProxy: boolean): ConversationThread {
    return {
      id: 'the-thread-id',
      subscription: {
        enrollmentDate: new Date('2021-01-01 00:00:00Z'),
        subscriptions: [],
      },
      usage: {
        conversationCounts: [],
      },
      permissions: {
        useNavieAIProxy,
      },
    };
  }

  it('should return status true when useNavieAIProxy is allowed', () => {
    const thread = createThreadWithPermissions(true);
    const result: EnrollmentStatus = checkProxyPermissions(thread);

    expect(result.status).toBe(true);
    expect(result.message).toBeUndefined();
  });

  describe('checkSubscription', () => {
    function createThread(subscriptionCount: number, usageCount: number): ConversationThread {
      return {
        id: 'the-thread-id',
        subscription: {
          enrollmentDate: new Date('2021-01-01 00:00:00Z'),
          subscriptions: Array(subscriptionCount).fill({
            productName: 'Navie AI',
          }) as SubscriptionItem[],
        },
        usage: {
          conversationCounts: [{ daysAgo: 7, count: usageCount }],
        },
        permissions: {
          useNavieAIProxy: true,
        },
      };
    }

    it('should return status true when user has an active subscription', () => {
      const thread = createThread(1, FREE_USAGE_LIMIT + 1);
      const result: EnrollmentStatus = checkSubscription(thread);

      expect(result.status).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return status true when usage item is not found', () => {
      const thread = createThread(0, 0);
      thread.usage.conversationCounts = [];
      const result: EnrollmentStatus = checkSubscription(thread);

      expect(result.status).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return status true when usage count is below the free usage limit', () => {
      const thread = createThread(0, FREE_USAGE_LIMIT - 2);
      const result: EnrollmentStatus = checkSubscription(thread);

      expect(result.status).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return status true with a warning message when usage count is at the warning threshold', () => {
      const thread = createThread(0, FREE_USAGE_LIMIT - 1);
      const result: EnrollmentStatus = checkSubscription(thread);

      expect(result.status).toBe(true);
      expect(result.message).toContain(
        'You have almost reached the usage limit of the free tier of Navie AI'
      );
    });

    it('should return status false with a required subscription message when usage count exceeds the free usage limit', () => {
      const thread = createThread(0, FREE_USAGE_LIMIT);
      const result: EnrollmentStatus = checkSubscription(thread);

      expect(result.status).toBe(false);
      expect(result.message).toContain(
        'You have reached the usage limit of the free tier of Navie AI. Please subscribe to continue using Navie AI.'
      );
    });
  });

  it('should return status false and a message when useNavieAIProxy is forbidden', () => {
    const thread = createThreadWithPermissions(false);
    const result: EnrollmentStatus = checkProxyPermissions(thread);

    expect(result.status).toBe(false);
    expect(result.message).toContain(
      'Use of Navie AI proxy is forbidden by your organization policy.'
    );
  });
});
