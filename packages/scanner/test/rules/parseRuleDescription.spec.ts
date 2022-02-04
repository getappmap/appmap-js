import parseRuleDescription from '../../src/rules/lib/parseRuleDescription';
import fs from 'fs';

it('parses rules markdown docs', async () => {
  const description = parseRuleDescription('authzBeforeAuthn');
  expect(description).toBe(
    'Determines when authorization logic is applied to a user identity that has not been properly ' +
      "verified. Because the the user's identity has not been verified yet, the outcome of the " +
      'authorization check cannot be trusted. A malicious user might be able to get themselves authorized ' +
      'as a different user than they really are - or they may not be logged in at all.'
  );
});

it('all rules are parseable', async () => {
  const files = fs.readdirSync('doc/rules');
  for (const file of files) {
    const description = parseRuleDescription(file.replace('.md', ''));
    expect(description).toBeTruthy();
  }
});
