export default function hardSubscriptionCheckEnabled(): boolean {
  return process.env.APPMAP_NAVIE_SUBSCRIPTION_CHECK === 'true';
}
