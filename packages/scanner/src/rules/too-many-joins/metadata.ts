import { Metadata } from '../lib/metadata';

export default {
  title: 'Too many joins',
  enumerateScope: false,
  impactDomain: 'Performance',
  impactSubdomains: ['Performance :: Inefficient data access'],
  references: {
    'CWE-1049': 'https://cwe.mitre.org/data/definitions/1049.html',
  },
} as Metadata;
