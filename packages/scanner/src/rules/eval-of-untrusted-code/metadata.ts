import { Metadata } from '../lib/metadata';

export const Eval = 'lang.eval';
export const EvalSafe = 'lang.eval.safe';
export const EvalSanitize = 'lang.eval.sanitize';

export default {
  title: 'Evaluation of untrusted code',
  enumerateScope: false,
  labels: [Eval, EvalSafe, EvalSanitize],
  impactDomain: 'Security',
  references: {
    'CWE-95': 'https://cwe.mitre.org/data/definitions/95.html',
  },
} as Metadata;
