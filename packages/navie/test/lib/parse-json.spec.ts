import parseJSON from '../../src/lib/parse-json';
import trimFences from '../../src/lib/trim-fences';

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
