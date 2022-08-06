import { Metadata } from '../lib/metadata';

export default {
  title: 'Hard-coded key',
  scope: 'root',
  enumerateScope: true,
  impactDomain: 'Security',
  references: {
    'A02:2021': 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
  },
  labels: ['crypto.encrypt', 'crypto.decrypt', 'crypto.set_key', 'string.unpack'],
} as Metadata;
