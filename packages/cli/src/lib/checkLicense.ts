import { warn } from 'node:console';

import { loadConfiguration, LicenseKey } from '@appland/client';
import { Telemetry } from '@appland/telemetry';

export default async function checkLicense(required = false): Promise<void> {
  const config = loadConfiguration(false);

  if (!config.apiKey) {
    warn(
      'Warning: No license key provided. Please set the APPMAP_API_KEY environment variable.'
    );
    if (required) throw new Error('License key is required');
    return;
  }

  if (await LicenseKey.check(config.apiKey)) {
    warn(`Valid license for ${config.username ?? 'unknown user'} at machine id ${Telemetry.machineId}.`);
  } else {
    warn('Warning: The provided license key is not valid.');
    if (required) throw new Error('The provided license key is not valid');
  }
}
