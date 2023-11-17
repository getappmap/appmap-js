import { warn } from 'console';
import OpenAI from 'openai';
import lunr from 'lunr';
import { ChatCompletionMessageParam } from 'openai/resources';
import { readFile } from 'fs/promises';
import { AppMapFilter, CodeObject, Event, Metadata, buildAppMap } from '@appland/models';
import { Action, Specification, buildDiagram, nodeName } from '@appland/sequence-diagram';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { exists, verbose } from '../../utils';
import FindAppMaps, { SearchResult as FindAppMapSearchResult } from '../../fulltext/FindAppMaps';
import FindEvents, { SearchResult as FindEventSearchResult } from '../../fulltext/FindEvents';

export const command = 'ask <question>';
export const describe =
  'Ask a plain text question and get a filtered and configured AppMap as a response';

export const builder = (args) => {
  args.positional('question', {
    describe: 'plain text question about the code base',
  });
  args.option('max-diagram-matches', {
    describe: 'maximum number of diagram matches to return',
    type: 'number',
    default: 5,
  });
  args.option('max-code-object-matches', {
    describe: 'maximum number of code objects matches to return for each diagram',
    type: 'number',
    default: 5,
  });
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  return args.strict();
};

function buildOpenAI(): OpenAI {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable must be set');
  }
  return new OpenAI({ apiKey: OPENAI_API_KEY });
}

type SerializedCodeObject = {
  name: string;
  type: string;
  labels: string[];
  children: SerializedCodeObject[];
  static?: boolean;
  sourceLocation?: string;
};

type ActionInfo = {
  elapsed?: number;
  eventId: number;
  location?: string;
};

type SearchDiagramResult = {
  diagramId: string;
};

type DiagramDetailsParam = {
  search: string;
  diagramIds: string[];
};

type LookupSourceCodeParam = {
  locations: string[];
};

type LookupSourceCodeResult = Record<string, string>;

type EventInfo = {
  name: string;
  fqid?: string;
  sourceLocation?: string;
  elapsed?: number;
  eventIds?: number[];
};

type DiagramDetailsResult = {
  summary: string;
  metadata: Metadata;
  keyEvents: FindEventSearchResult[];
};

const isCamelized = (str: string): boolean => {
  if (str.length < 3) return false;

  const testStr = str.slice(1);
  return /[a-z][A-Z]/.test(testStr);
};

const splitCamelized = (str: string): string => {
  if (!isCamelized(str)) return str;

  const result = new Array<string>();
  let last = 0;
  for (let i = 1; i < str.length; i++) {
    const pc = str[i - 1];
    const c = str[i];
    const isUpper = c >= 'A' && c <= 'Z';
    if (isUpper) {
      result.push(str.slice(last, i));
      last = i;
    }
  }
  result.push(str.slice(last));
  return result.join(' ');
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);
  const { question, maxCodeObjectMatches, maxDiagramMatches } = argv;
  const appmapDir = await locateAppMapDir(argv.appmapDir);

  const findAppMaps = new FindAppMaps(appmapDir);
  await findAppMaps.initialize();

  function showPlan(paramStr: string) {
    let params: any;
    try {
      params = JSON.parse(paramStr) as { plan: string };
    } catch (e) {
      warn(`Failed to parse plan: ${paramStr}: ${e}`);
      return;
    }
    warn(`AI Plan: ${params.plan}`);
  }

  function fetchDiagrams(): FindAppMapSearchResult[] {
    warn(`Fetching diagrams`);
    return findAppMaps.search(question, { maxResults: maxDiagramMatches });
  }

  const diagramDetailsResults = new Array<FindEventSearchResult>();

  async function getDiagramDetails(paramStr: string): Promise<DiagramDetailsResult[]> {
    const params = JSON.parse(paramStr) as DiagramDetailsParam;
    const { diagramIds } = params;
    warn(`Getting details for diagram ${diagramIds}, retrieved by "${question}"`);
    const result = new Array<DiagramDetailsResult>();
    for (const diagramId of diagramIds) {
      warn(`Loading AppMap ${diagramId} and pruning to 1MB`);

      const index = new FindEvents(diagramId);
      index.maxSize = 1024 * 1024;
      await index.initialize();
      const searchResults = index.search(question, { maxResults: maxCodeObjectMatches });
      diagramDetailsResults.push(...searchResults);

      const diagramText = new Array<string>();
      for (const event of index.appmap.rootEvents()) {
        const actionInfo: ActionInfo = { eventId: event.id };
        if (event.elapsedTime) actionInfo.elapsed = event.elapsedTime;
        if (event.codeObject.location) actionInfo.location = event.codeObject.location;
        const actionInfoStr = Object.keys(actionInfo)
          .sort()
          .map((key) => {
            const value = actionInfo[key];
            return `${key}=${value}`;
          })
          .join(',');
        diagramText.push(
          `${event.codeObject.id}${actionInfoStr !== '' ? ` (${actionInfoStr})` : ''}`
        );
      }

      const metadata = index.appmap.metadata;
      delete metadata['git'];
      delete (metadata as any)['client'];
      // TODO: Do we want the AI to read the source code of the test case?
      delete metadata['source_location'];
      result.push({ metadata, summary: diagramText.join('\n'), keyEvents: searchResults });
    }

    return result;
  }

  async function lookupSourceCode(
    locationStr: string
  ): Promise<LookupSourceCodeResult | undefined> {
    const params = JSON.parse(locationStr) as LookupSourceCodeParam;

    const languageRegexMap: Record<string, RegExp> = {
      '.rb': new RegExp(`def\\s+\\w+.*?\\n(.*?\\n)*?^end\\b`, 'gm'),
      '.java': new RegExp(
        `(?:public|private|protected)?\\s+(?:static\\s+)?(?:final\\s+)?(?:synchronized\\s+)?(?:abstract\\s+)?(?:native\\s+)?(?:strictfp\\s+)?(?:transient\\s+)?(?:volatile\\s+)?(?:\\w+\\s+)*\\w+\\s+\\w+\\s*\\([^)]*\\)\\s*(?:throws\\s+\\w+(?:,\\s*\\w+)*)?\\s*\\{(?:[^{}]*\\{[^{}]*\\})*[^{}]*\\}`,
        'gm'
      ),
      '.py': new RegExp(`def\\s+\\w+.*?:\\n(.*?\\n)*?`, 'gm'),
      '.js': new RegExp(
        `(?:async\\s+)?function\\s+\\w+\\s*\\([^)]*\\)\\s*\\{(?:[^{}]*\\{[^{}]*\\})*[^{}]*\\}`,
        'gm'
      ),
    };

    const result: LookupSourceCodeResult = {};
    for (const location of params.locations) {
      const [path, lineno] = location.split(':');

      if (await exists(path)) {
        const fileContent = await readFile(path, 'utf-8');
        let functionContent: string | undefined;
        if (lineno) {
          const extension = path.substring(path.lastIndexOf('.'));
          const regex = languageRegexMap[extension];

          if (regex) {
            const match = regex.exec(fileContent);
            if (match) {
              const lines = match[0].split('\n');
              const startLine = parseInt(lineno, 10);
              const endLine = startLine + lines.length - 1;
              if (startLine <= endLine) {
                functionContent = lines.slice(startLine - 1, endLine).join('\n');
              }
            }
          }
        } else {
          functionContent = fileContent;
        }
        if (functionContent) result[location] = functionContent;
      }
    }
    return result;
  }

  const systemMessages: ChatCompletionMessageParam[] = [
    'You are an assistant that answers questions about the design and architecture of code.',
    'You answer these questions by accessing a knowledge base of sequence diagrams.',
    'Each sequence diagram conists of a series of events, such as function calls, HTTP server requests, SQL queries, etc.',
    'Before each function call, call "showPlan" function with a Markdown document that describes your strategy for answering the question.',
    `Begin by calling the "fetchDiagrams" function to obtain the diagrams that are most relevant to the user's question.`,
    'Next, use the "getDiagramDetails" function get details about the events that occur with in the matching diagrams.',
    'Enhance your answer by using "lookupSourceCode" function to get the source code for the most relevant functions.',
    'Finally, respond with a Markdown document that summarizes the diagrams and answers the question.',
    'Never emit phrases like "note that the actual behavior may vary between different applications"',
  ].map((msg) => ({
    content: msg,
    role: 'system',
  }));

  const userMessage: ChatCompletionMessageParam = {
    content: question,
    role: 'user',
  };

  const messages = [...systemMessages, userMessage];

  const openai = buildOpenAI();
  const runFunctions = openai.beta.chat.completions.runFunctions({
    model: 'gpt-4',
    messages,
    function_call: 'auto',
    functions: [
      {
        function: showPlan,
        description: 'Print the plan for answering the question',
        parameters: {
          type: 'object',
          properties: {
            plan: {
              type: 'string',
              description: 'The plan in Markdown format',
            },
          },
          required: ['plan'],
        },
      },
      {
        function: fetchDiagrams,
        description: `Obtain sequence diagrams that are relevant to the user's question. The response is a list of diagram ids.`,
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        function: getDiagramDetails,
        description: `Get details about diagrams, including their name, code language, frameworks, source location, exceptions raised.`,
        parameters: {
          type: 'object',
          properties: {
            diagramIds: {
              type: 'array',
              description: 'Array of diagram ids',
              items: {
                type: 'string',
              },
            },
          },
          required: ['search', 'diagramIds'],
        },
      },
      {
        function: lookupSourceCode,
        description: `Get the source code for a specific function.`,
        parameters: {
          type: 'object',
          properties: {
            locations: {
              type: 'array',
              description: `An array of source code locations in the format <path>[:<line number>]. Line number can be omitted if it's not known.`,
              items: {
                type: 'string',
              },
            },
          },
          required: ['locations'],
        },
      },
    ],
  });

  runFunctions.on('functionCall', (data) => {
    warn(JSON.stringify(data, null, 2));
  });
  runFunctions.on('finalFunctionCall', (data) => {
    warn(JSON.stringify(data, null, 2));
  });
  runFunctions.on('functionCallResult', (data) => {
    if (verbose()) warn(JSON.stringify(data));
  });
  runFunctions.on('finalFunctionCallResult', (data) => {
    if (verbose()) warn(JSON.stringify(data));
  });

  const response = await runFunctions.finalContent();
  if (!response) {
    warn(`No response from OpenAI`);
    return;
  }
  console.log(response);
  console.log('');
  console.log('The best matching sequence diagram events are:');
  console.log('');
  diagramDetailsResults.sort((a, b) => b.score - a.score);
  for (const event of diagramDetailsResults) {
    console.log(`  ${event.fqid} (${event.score})`);
  }
};
