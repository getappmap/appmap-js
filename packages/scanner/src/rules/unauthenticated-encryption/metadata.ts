import { Metadata } from '../lib/metadata';

export default {
  title: 'Unauthenticated encryption',
  enumerateScope: true,
  impactDomain: 'Security',
  impactSubdomains: ['Security :: Cryptographic failure'],
  references: {
    'A02:2021': 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
  },
  labels: ['crypto.encrypt', 'crypto.set_auth_data'],
} as Metadata;
