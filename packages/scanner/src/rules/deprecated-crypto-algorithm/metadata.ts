import { Metadata } from '../lib/metadata';

export const labels = ['crypto.encrypt', 'crypto.decrypt', 'crypto.digest'];

export default {
  title: 'Deprecated cryptographic algorithm',
  scope: 'root',
  enumerateScope: true,
  impactDomain: 'Security',
  references: {
    'A02:2021': 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
  },
  labels,
} as Metadata;
