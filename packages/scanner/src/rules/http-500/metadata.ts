import { Metadata } from '../lib/metadata';

export default {
  title: 'HTTP 500 status code',
  scope: 'http_server_request',
  enumerateScope: false,
  impactDomain: 'Stability',
  references: {
    'CWE-392': 'https://cwe.mitre.org/data/definitions/392.html',
  },
} as Metadata;
