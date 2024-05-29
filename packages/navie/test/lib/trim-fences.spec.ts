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
  ];

  TEST_DATA.forEach(([input, expected]) => {
    it(`should return the expected output`, () => {
      expect(trimFences(input)).toEqual(expected);
    });
  });
});
