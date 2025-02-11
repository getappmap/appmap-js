import parseJSON, { findObject, tryParseJson } from '../../src/lib/parse-json';

describe('parse-json.ts', () => {
  describe('parseJSON', () => {
    const TEST_DATA: [string, unknown][] = [
      // Fenced JSON array
      [
        `\`\`\`
["user", "management"]
\`\`\``,
        ['user', 'management'],
      ],
      // Fenced JSON object
      [
        `\`\`\`
{"key": "value"}
\`\`\``,
        { key: 'value' },
      ],
      // Fenced JSON arry with ```json hint
      [
        `Here is the list of file names mentioned in the text:

\`\`\`json
["user", "management"]
\`\`\``,
        ['user', 'management'],
      ],
      // Unfenced JSON array
      [`["user", "management"]`, ['user', 'management']],
      // Unfenced JSON object
      [`{"key": "value"}`, { key: 'value' }],
      // Mixed content with recognizable array
      [`Some text before\n["user", "management"]\nSome text after`, ['user', 'management']],
      // Mixed content with recognizable object
      [`Some text before\n{"key": "value"}\nSome text after`, { key: 'value' }],
      // Invalid JSON
      [`Invalid JSON content`, undefined],
    ];

    TEST_DATA.forEach(([input, expected]) => {
      it(`parses ${input} as ${JSON.stringify(expected)}`, () => {
        expect(parseJSON(input, false)).toEqual(expected);
      });
    });
  });

  describe('findObject', () => {
    it('finds a single line object in a string', () => {
      expect(findObject(`{"key": "value"}`)).toEqual(`{"key": "value"}`);
    });

    it('finds a multi-line object in a string', () => {
      expect(
        findObject(`"Based on the provided transcript of analyzing code related to administrators modifying roles, I'll suggest the likely next actions.
{
  "nextSteps": [
    {
      "command": "diagram",
      "prompt": "diagram the role update",
    }
  ]
}`)
      ).toEqual(`{
  "nextSteps": [
    {
      "command": "diagram",
      "prompt": "diagram the role update",
    }
  ]
}`);
    });

    it('returns undefined if no object is found', () => {
      expect(findObject(`I'm sorry, I don't understand the request.`)).toBeUndefined();
    });
  });

  describe('tryParseJson', () => {
    it('parses a string as JSON', () => {
      expect(tryParseJson(`{"key": "value"}`)).toEqual({ key: 'value' });
    });

    it('throws an exception if the string cannot be parsed', () => {
      expect(() => tryParseJson('Invalid JSON content', () => 'more invalid JSON')).toThrow();
    });

    it('tries multiple parsers in order', () => {
      const parsers = [jest.fn(), jest.fn().mockReturnValue('this is not JSON'), findObject];
      expect(tryParseJson(`Here's some JSON:\n{"key": "value"}`, ...parsers)).toEqual({
        key: 'value',
      });
      expect(parsers[0]).toHaveBeenCalled();
      expect(parsers[1]).toHaveBeenCalled();
    });
  });
});
