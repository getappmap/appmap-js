import { ConversationThread } from '@appland/client';
import { warn } from 'console';
import hardSubscriptionCheckEnabled from './hard-subscription-check-enabled';

export const FREE_USAGE_DURATION = 7;
export const FREE_USAGE_LIMIT = 3;

const SUBSCRIPTION_INSTRUCTIONS = `To subscribe, visit https://getappmap.com. Sign in using your email,
then click on the "Subscribe" button on your Account page.

Pricing information is available at https://appmap.io/pricing, and details of the subscription
process and features are available at https://appmap.io/docs/reference/subscription.

For enterprise subscriptions, please contact support@appmap.io.
`;

const SUBSCRIPTION_WARNING_MESSAGE = `You have almost reached the usage limit of the free tier of Navie AI,
which allows you to have up to ${FREE_USAGE_LIMIT} conversations in each ${FREE_USAGE_DURATION} day period.

${SUBSCRIPTION_INSTRUCTIONS}
`;

const SUBSCRIPTION_REQUIRED_MESSAGE = `You have reached the usage limit of the free tier of Navie AI. Please subscribe to continue using Navie AI.

${SUBSCRIPTION_INSTRUCTIONS}
`;

export type EnrollmentStatus = {
  message?: string;
  status: boolean;
};

export function checkProxyPermissions(thread: ConversationThread): EnrollmentStatus {
  if (!thread.permissions.useNavieAIProxy) {
    return {
      message: `Use of Navie AI proxy is forbidden by your organization policy.\nYou can ignore this message if you're using your own AI API key or connecting to your own model.`,
      status: false,
    };
  }

  return { status: true };
}

export function checkSubscription(thread: ConversationThread): EnrollmentStatus {
  if (!hardSubscriptionCheckEnabled()) return { status: true };

  const { subscription, usage } = thread;

  // If the user has a subscription, they can continue using Navie AI.
  if (subscription.subscriptions.length > 0) return { status: true };

  const usageItem = usage.conversationCounts.find((item) => item.daysAgo === FREE_USAGE_DURATION);
  if (!usageItem) {
    warn(`Failed to find usage item for ${FREE_USAGE_DURATION} days ago`);
    return {
      status: true,
    };
  }

  if (usageItem.count < FREE_USAGE_LIMIT - 1) return { status: true };

  if (usageItem.count == FREE_USAGE_LIMIT - 1)
    return { message: SUBSCRIPTION_WARNING_MESSAGE, status: true };

  return {
    message: SUBSCRIPTION_REQUIRED_MESSAGE,
    status: false,
  };
}
