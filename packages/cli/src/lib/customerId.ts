/**
 * The customer ID identifies the customer in a managed deployment, where entitlement is settled by
 * a B2B agreement rather than by authenticating against getappmap.com. It is set by administrators
 * through the IDE extension's organization configuration, which passes it down to this process as
 * APPMAP_CUSTOMER_ID.
 *
 * It is *not* a credential and never stands in for an API key: when both are present the API key
 * wins for authentication and the customer ID is attribution-only. Blank values read as unset.
 */
export default function customerId(): string | undefined {
  const value = process.env.APPMAP_CUSTOMER_ID?.trim();
  return value ? value : undefined;
}
