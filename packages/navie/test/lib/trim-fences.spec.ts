import trimFences from '../../src/lib/trim-fences';

describe('trimFences', () => {
  const TEST_DATA = [
    [
      `\`\`\`
["user", "management"]
\`\`\``,
      `["user", "management"]`,
    ],
    [
      `\`\`\`json
["user", "management"]
\`\`\``,
      `["user", "management"]`,
    ],
    [
      `\`\`\`json
["user", "management"]
\`\`\`
`,
      `["user", "management"]`,
    ],
    // Fenced JSON array with ```json hint
    [
      `Here is the list of file names mentioned in the text:

\`\`\`json
["user", "management"]
\`\`\``,
      `["user", "management"]`,
    ],
    // Fenced JSON object which spans multiple lines, with text before and after
    [
      `Here is the list of file names mentioned in the text:

\`\`\`json
{
  "key1": "value1",
  "key2: "value2"
}
\`\`\`
Hope this is helpful!
`,
      `{
  "key1": "value1",
  "key2: "value2"
}`,
    ],
  ];

  TEST_DATA.forEach(([input, expected]) => {
    it(`should return the expected output for ${input}`, () => {
      expect(trimFences(input)).toEqual(expected);
    });
  });
});
