import collectContext from '../../src/services/apply-context-service';

const SEQUENCE_DIAGRAMS = [`diagram-1`, `diagram-2`];
const CODE_SNIPPETS = {
  'app/user.rb': `class User < ApplicationRecord; end`,
  'app/post.rb': `class Post < ApplicationRecord; end`,
};
const CODE_OBJECTS = [
  `SELECT "users".* FROM "users" WHERE "users"."id" = $1 LIMIT 1`,
  `SELECT "posts".* FROM "posts" WHERE "posts"."user_id" = $1`,
];

describe('collectContext', () => {
  const collect = (characterLimit: number) =>
    collectContext(
      {
        sequenceDiagrams: SEQUENCE_DIAGRAMS,
        codeSnippets: CODE_SNIPPETS,
        codeObjects: CODE_OBJECTS,
      },
      characterLimit
    );

  it('collects samples of context into the output', () => {
    expect(collect(1000 * 1000)).toEqual([
      `Sequence diagram: ${SEQUENCE_DIAGRAMS[0]}`,
      ...Object.entries(CODE_SNIPPETS).map((entry) => `${entry[0]}: ${entry[1]}`),
      ...CODE_OBJECTS,
      `Sequence diagram: ${SEQUENCE_DIAGRAMS[1]}`,
    ]);
  });

  it('limits the output to the character limit', () => {
    expect(collect(100)).toEqual([
      `Sequence diagram: ${SEQUENCE_DIAGRAMS[0]}`,
      ...Object.entries(CODE_SNIPPETS)
        .slice(0, 1)
        .map((entry) => `${entry[0]}: ${entry[1]}`),
    ]);
  });
});
