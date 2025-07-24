import { networkInterfaces } from 'os';
import { randomBytes, createHash, BinaryLike } from 'crypto';
import type Conf from 'conf';

const invalidMacAddresses = new Set([
  '00:00:00:00:00:00',
  'ff:ff:ff:ff:ff:ff',
  'ac:de:48:00:11:22',
]);

export function getMachineId(config?: Conf): string {
  const machineId = config?.get('machineId') as string | undefined;
  if (machineId) {
    return machineId;
  }

  let machineIdSource: BinaryLike | undefined;

  // Derive a machine ID from the first network interface
  machineIdSource = Object.values(networkInterfaces())
    .flat()
    .map((iface) => iface?.mac)
    .filter((mac) => mac && !invalidMacAddresses.has(mac))
    .shift();

  if (!machineIdSource) {
    // Fallback to a random string
    machineIdSource = randomBytes(32);
  }

  const machineIdHash = createHash('sha256')
    .update(machineIdSource as BinaryLike)
    .digest('hex');

  config?.set('machineId', machineIdHash);

  return machineIdHash;
}
