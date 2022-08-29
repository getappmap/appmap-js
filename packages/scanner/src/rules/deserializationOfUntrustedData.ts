import { Event } from '@appland/models';
import { MatchResult, Rule } from '../types';
import { URL } from 'url';
import parseRuleDescription from './lib/parseRuleDescription';
import analyzeDataFlow, { TrackedValue } from './lib/analyzeDataFlow';

function valueHistory(value: TrackedValue): Event[] {
  const events: Event[] = [];
  const queue = [value];

  for (;;) {
    const current = queue.shift();
    if (!current) break;
    const { origin, parents } = current;
    if (!events.includes(origin)) events.push(origin);
    queue.push(...parents);
  }

  return events;
}

function wasSanitized(value: TrackedValue): boolean {
  return valueHistory(value).some(({ labels }) => labels.has(DeserializeSanitize));
}

function formatHistories(values: ReadonlyArray<TrackedValue>): { [k: string]: Event } {
  const histories = values.map(valueHistory);

  return Object.fromEntries(
    histories.flatMap((history, input) =>
      history.map((event, idx) => [`origin[${input}][${idx}]`, event])
    )
  );
}

function label(name: string): ({ labels }: Event) => boolean {
  return ({ labels }: Event) => labels.has(name);
}

function matcher(startEvent: Event): MatchResult[] {
  const flow = analyzeDataFlow([...(startEvent.message || [])], startEvent);
  const results: MatchResult[] = [];
  const sanitizedValues = new Set<TrackedValue>();
  for (const [event, values] of flow) {
    if (event.labels.has(DeserializeSanitize)) {
      for (const v of values) sanitizedValues.add(v);
      continue;
    }

    if (!event.labels.has(DeserializeUnsafe)) continue;

    const unsanitized = new Set(values.filter((v) => !(wasSanitized(v) || sanitizedValues.has(v))));

    // remove any that have been passed into a safe deserialization function
    for (const ancestor of event.ancestors().filter(label(DeserializeSafe))) {
      for (const v of flow.get(ancestor) || []) {
        unsanitized.delete(v);
      }
    }

    const remaining = [...unsanitized];

    if (remaining.length === 0) continue;

    results.push({
      event: event,
      message: `deserializes untrusted data: ${remaining.map(({ value: { value } }) => value)}`,
      participatingEvents: formatHistories(remaining),
    });
  }
  return results;
}

const DeserializeUnsafe = 'deserialize.unsafe';
const DeserializeSafe = 'deserialize.safe';
const DeserializeSanitize = 'deserialize.sanitize';

export default {
  id: 'deserialization-of-untrusted-data',
  title: 'Deserialization of untrusted data',
  labels: [DeserializeUnsafe, DeserializeSafe, DeserializeSanitize],
  impactDomain: 'Security',
  impactSubdomains: ['Security :: Injection'],
  enumerateScope: false,
  scope: 'http_server_request',
  references: {
    'CWE-502': new URL('https://cwe.mitre.org/data/definitions/502.html'),
    'Ruby Security': new URL('https://docs.ruby-lang.org/en/3.0/doc/security_rdoc.html'),
  },
  description: parseRuleDescription('deserializationOfUntrustedData'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#deserialization-of-untrusted-data',
  build: () => ({ matcher }),
} as Rule;
