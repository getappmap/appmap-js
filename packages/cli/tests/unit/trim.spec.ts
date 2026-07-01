import { trimAppMap } from '../../src/cmds/trim/trim';

// Build a loosely-typed AppMap-ish object for exercising trimAppMap.
function appmap(events: unknown[]): any {
  return { events };
}

describe('trim command', () => {
  describe('trimAppMap', () => {
    it('truncates values across every captured slot while preserving structure', () => {
      const long = 'x'.repeat(500);
      const trimmed: any = trimAppMap(
        appmap([
          {
            id: 1,
            event: 'call',
            parameters: [{ name: 'a', value: long }],
            receiver: { value: long },
            message: [{ name: 'q', value: long }],
          },
          {
            id: 2,
            event: 'return',
            return_value: { value: long },
            exceptions: [{ class: 'E', value: long }],
          },
        ])
      );

      // Structure — event count and field names — is preserved.
      expect(trimmed.events).toHaveLength(2);
      expect(trimmed.events[0].parameters[0].name).toBe('a');
      expect(trimmed.events[0].message[0].name).toBe('q');
      expect(trimmed.events[1].exceptions[0].class).toBe('E');

      // Every captured slot type is truncated (default flat cap 120).
      for (const value of [
        trimmed.events[0].parameters[0].value,
        trimmed.events[0].receiver.value,
        trimmed.events[0].message[0].value,
        trimmed.events[1].return_value.value,
        trimmed.events[1].exceptions[0].value,
      ]) {
        expect(value.length).toBeLessThanOrEqual(120);
        expect(value.endsWith('…')).toBe(true);
      }
    });

    it('parses a multi-line util.inspect object value and budgets it per field', () => {
      // The shape appmap-node captures for a JS object (ClassName {\n ... }).
      const value = `User {\n  id: 42,\n  secret: '${'x'.repeat(300)}',\n  name: 'alice'\n}`;
      const trimmed: any = trimAppMap(appmap([{ return_value: { value } }]));
      const out: string = trimmed.events[0].return_value.value;

      // Recognized as a struct (kept its type prefix + braces), and far shorter
      // than a flat 120-char cut of the raw multi-line blob.
      expect(out.startsWith('User {')).toBe(true);
      expect(out.endsWith('}')).toBe(true);
      expect(out).toContain('id: 42');
      expect(out).not.toContain('x'.repeat(60));
      expect(out.length).toBeLessThan(value.length);
    });

    it('clips id/uuid-shaped field values tighter than ordinary ones', () => {
      const value =
        'ApprovalRequest[requestId=d179dbbd-cc67-4384-a97f-36fd9eeedeb2, status=APPROVED]';
      const trimmed: any = trimAppMap(appmap([{ parameters: [{ value }] }]));
      const out: string = trimmed.events[0].parameters[0].value;
      expect(out).toContain('status=APPROVED'); // state field survives
      expect(out).not.toContain('36fd9eeedeb2'); // uuid tail clipped
    });

    it('respects a custom budget (flatCap via --max-length)', () => {
      const trimmed: any = trimAppMap(appmap([{ return_value: { value: 'y'.repeat(200) } }]), {
        perValueCap: 48,
        idCap: 12,
        maxFields: 12,
        flatCap: 20,
      });
      expect(trimmed.events[0].return_value.value.length).toBeLessThanOrEqual(20);
    });

    it('leaves short and non-string values untouched', () => {
      const trimmed: any = trimAppMap(
        appmap([{ parameters: [{ value: 'short' }, { value: 42 }, { value: null }, {}] }])
      );
      const params = trimmed.events[0].parameters;
      expect(params[0].value).toBe('short');
      expect(params[1].value).toBe(42);
      expect(params[2].value).toBeNull();
      expect(params[3].value).toBeUndefined();
    });

    it('no-ops on events without value slots and on an empty AppMap', () => {
      expect(() => trimAppMap(appmap([{ id: 1, event: 'call' }]))).not.toThrow();
      expect(trimAppMap(appmap([])).events).toEqual([]);
      expect(trimAppMap({}).events).toBeUndefined();
    });

    it('is idempotent — trimming an already-trimmed map changes nothing', () => {
      const once: any = trimAppMap(appmap([{ return_value: { value: 'z'.repeat(400) } }]));
      const twice: any = trimAppMap(once);
      expect(twice.events[0].return_value.value).toBe(once.events[0].return_value.value);
    });
  });
});
