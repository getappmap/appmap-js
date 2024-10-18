import { ContextV2 } from '../src/context';
import Message from '../src/message';
import { ProjectInfoProvider } from '../src/project-info';
import VectorTermsService from '../src/services/vector-terms-service';

export const SEQUENCE_DIAGRAMS = [`diagram-1`, `diagram-2`];

export const CODE_SNIPPETS = {
  'app/user.rb': `class User < ApplicationRecord; end`,
  'app/post.rb': `class Post < ApplicationRecord; end`,
};

export const DATA_REQUESTS = [
  `SELECT "users".* FROM "users" WHERE "users"."id" = $1 LIMIT 1`,
  `SELECT "posts".* FROM "posts" WHERE "posts"."user_id" = $1`,
];

export const SEARCH_CONTEXT: ContextV2.ContextResponse = [
  ...SEQUENCE_DIAGRAMS.map((content) => ({
    type: ContextV2.ContextItemType.SequenceDiagram,
    content,
  })),
  ...Object.entries(CODE_SNIPPETS).map(([location, content]) => ({
    type: ContextV2.ContextItemType.CodeSnippet,
    location,
    content,
  })),
  ...DATA_REQUESTS.map((content) => ({
    type: ContextV2.ContextItemType.DataRequest,
    content,
  })),
];

export const HELP_CONTEXT = [
  {
    filePath: 'appmap-java.md',
    content: 'AppMap Java reference',
    from: 1,
    to: 10,
    score: 1,
  },
];

export const TOKEN_STREAM: AsyncIterable<string> = {
  [Symbol.asyncIterator]: async function* () {
    yield 'The user management system is a system ';
    yield 'that allows users to create and manage their own accounts.';
  },
};

export function suggestsVectorTerms(
  question: string,
  codeSelection: string | undefined,
  response = ['user', 'management']
): VectorTermsService {
  const suggestTerms = jest.fn().mockImplementation((query: string) => {
    expect(query).toEqual([question, codeSelection].filter(Boolean).join('\n\n'));
    return Promise.resolve(response);
  });
  return {
    suggestTerms,
  } as unknown as VectorTermsService;
}

export const APPMAP_CONFIG = {
  name: 'mock-project',
  language: 'ruby',
  appmap_dir: 'tmp/appmap',
  packages: ['lib'],
};

export const APPMAP_STATS = {
  classes: 7,
  methods: 10,
  packages: 3,
  numAppMaps: 5,
};

export function providesProjectInfo(): ProjectInfoProvider {
  return jest.fn().mockResolvedValue({
    appmapConfig: APPMAP_CONFIG,
    appmapStats: APPMAP_STATS,
  });
}

export function doesNotPredictSummary() {
  return jest
    .fn()
    .mockRejectedValue('predictSummary should not be called for the initial question');
}

export function doesNotRequestContext() {
  return jest.fn().mockRejectedValue('requestContext should not be called for follow-up questions');
}

export function predictsSummary(): (messages: Message[]) => void {
  return jest.fn().mockImplementation((_messages: Message[]) => {
    return Promise.resolve([]);
  });
}
