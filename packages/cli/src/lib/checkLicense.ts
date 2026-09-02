/* eslint-disable no-console */
// These warnings are the command's user-facing licensing output, not print debugging.
//
// Most of this package marks such output by importing `warn` from 'console' instead, which
// sidesteps no-console because the rule only matches the global. That import also bypasses jest's
// console, so the messages escape test buffering — hence the global here. A shared output helper
// owning this suppression would be better than either, but that is a package-wide change.

import { loadConfiguration, LicenseKey } from '@appland/client';
import { Telemetry } from '@appland/telemetry';

import customerId from './customerId';

export default async function checkLicense(required = false): Promise<void> {
  const config = loadConfiguration(false);
  const customer = customerId();

  // Reported whatever the key turns out to be: an entitled installation that says nothing about it
  // is indistinguishable from one where the customer ID was never configured.
  if (customer)
    console.warn(
      `Entitled to AppMap as customer ${customer} at machine id ${Telemetry.machineId}.`
    );

  // A customer ID entitles the installation on its own, so a key that is missing, rejected or
  // unverifiable is reported but not fatal. Throw when nothing covers the problem and leave the
  // caller to surface it; otherwise this is the only report of it.
  const licenseProblem = (message: string, error?: unknown): void => {
    if (required && !customer) throw error ?? new Error(message);
    console.warn(`Warning: ${message}`);
  };

  if (!config.apiKey) {
    // Entitlement is reported above, and the missing key is expected in that case.
    if (customer) return;

    licenseProblem('No license key provided. Please set the APPMAP_API_KEY environment variable.');
    return;
  }

  // The key is still checked when a customer ID is also set: it is what authenticates, and the
  // check is a server-visible event that usage tracking depends on. Entitlement only decides
  // whether a bad outcome is fatal.
  try {
    if (await LicenseKey.check(config.apiKey)) {
      console.warn(
        `Valid license for ${config.username ?? 'unknown user'} at machine id ${Telemetry.machineId}.`
      );
      return;
    }
  } catch (e) {
    // Rethrow the original error rather than one built from the message, so a caller that does
    // escalate keeps the stack.
    licenseProblem(`Failed to check license key: ${e instanceof Error ? e.message : String(e)}`, e);
    return;
  }

  licenseProblem('The provided license key is not valid.');
}
