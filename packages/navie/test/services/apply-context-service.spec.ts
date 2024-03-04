import InteractionHistory from '../../src/interaction-history';
import ApplyContextService from '../../src/services/apply-context-service';

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
  let interactionHistory: InteractionHistory;
  let applyContextService: ApplyContextService;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    applyContextService = new ApplyContextService(interactionHistory);
  });
  afterEach(() => jest.resetAllMocks());

  const collect = (characterLimit: number) =>
    applyContextService.applyContext(
      {
        sequenceDiagrams: SEQUENCE_DIAGRAMS,
        codeSnippets: CODE_SNIPPETS,
        codeObjects: CODE_OBJECTS,
      },
      characterLimit
    );

  it('collects samples of context into the output', () => {
    collect(1000 * 1000);
    expect(
      interactionHistory.events.filter((e) => e.name === 'contextItem').map((e) => ({ ...e }))
    ).toEqual([
      {
        name: 'contextItem',
        contextItem: {
          content: `diagram-1`,
          name: 'Sequence diagram',
        },
        file: undefined,
      },
      {
        name: 'contextItem',
        contextItem: {
          content: `class User < ApplicationRecord; end`,
          name: 'Code snippet',
        },
        file: 'app/user.rb',
      },
      {
        name: 'contextItem',
        contextItem: {
          content: `class Post < ApplicationRecord; end`,
          name: 'Code snippet',
        },
        file: 'app/post.rb',
      },
      {
        name: 'contextItem',
        contextItem: {
          content: `SELECT "users".* FROM "users" WHERE "users"."id" = $1 LIMIT 1`,
          name: 'Data request',
        },
        file: undefined,
      },
      {
        name: 'contextItem',
        contextItem: {
          content: `SELECT "posts".* FROM "posts" WHERE "posts"."user_id" = $1`,
          name: 'Data request',
        },
        file: undefined,
      },
      {
        name: 'contextItem',
        contextItem: {
          content: `diagram-2`,
          name: 'Sequence diagram',
        },
        file: undefined,
      },
    ]);
  });

  it('limits the output to the character limit', () => {
    collect(75);
    expect(
      interactionHistory.events.filter((e) => e.name === 'contextItem').map((e) => ({ ...e }))
    ).toEqual([
      {
        name: 'contextItem',
        contextItem: {
          content: `diagram-1`,
          name: 'Sequence diagram',
        },
        file: undefined,
      },
      {
        name: 'contextItem',
        contextItem: {
          content: `class User < ApplicationRecord; end`,
          name: 'Code snippet',
        },
        file: 'app/user.rb',
      },
    ]);
  });
});
