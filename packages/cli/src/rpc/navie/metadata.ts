import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import { INavieProvider } from '../explain/navie/inavie';
import { formatWelcomeMessage, getWelcomeMessage } from './welcome-suggestion';

const COMMANDS = [
  {
    name: '@explain',
    description:
      'Ask questions about the codebase, and Navie will respond with explanations, diagrams, code snippets, and more. This is the default mode.',
    referenceUrl: 'https://appmap.io/docs/reference/navie.html#explain',
  },
  {
    name: '@diagram',
    description: 'Navie can generate Mermaid diagrams based on your request.',
    referenceUrl: 'https://appmap.io/docs/reference/navie.html#diagram',
    demoUrls: [],
  },
  {
    name: '@plan',
    description: 'Create a plan to implement a solution to a code issue or feature.',
    referenceUrl: 'https://appmap.io/docs/reference/navie.html#plan',
    demoUrls: ['https://vimeo.com/985121150'],
  },
  {
    name: '@generate',
    description: 'Generate code based on a given plan.',
    referenceUrl: 'https://appmap.io/docs/reference/navie.html#generate',
    demoUrls: ['https://vimeo.com/985121150'],
  },
  {
    name: '@test',
    description: 'Write tests for your code.',
    referenceUrl: 'https://appmap.io/docs/navie-reference/navie-commands.html#test',
  },
  {
    name: '@search',
    description: 'Search your codebase with Navie.',
    referenceUrl: 'https://appmap.io/docs/navie-reference/navie-commands.html#review',
  },
  {
    name: '@review',
    description:
      'Navie will provide feedback on the changes in your current branch. Use /base=<ref> to specify the base reference.',
    referenceUrl: 'https://appmap.io/docs/navie-reference/navie-commands.html#search',
  },
  {
    name: '@help',
    description: 'Get help with AppMap and Navie AI.',
    referenceUrl: 'https://appmap.io/docs/reference/navie.html#help',
  },
];

const INPUT_PLACEHOLDER = 'Ask a question or enter `@` for commands';

export function navieMetadataV1(
  navieProvider: INavieProvider
): RpcHandler<NavieRpc.V1.Metadata.Params, NavieRpc.V1.Metadata.Response> {
  return {
    name: NavieRpc.V1.Metadata.Method,
    handler: async () => ({
      welcomeMessage: formatWelcomeMessage(await getWelcomeMessage(navieProvider)),
      inputPlaceholder: INPUT_PLACEHOLDER,
      commands: COMMANDS,
    }),
  };
}

export function navieMetadataV2(): RpcHandler<
  NavieRpc.V2.Metadata.Params,
  NavieRpc.V2.Metadata.Response
> {
  return {
    name: NavieRpc.V2.Metadata.Method,
    handler: () => ({
      inputPlaceholder: INPUT_PLACEHOLDER,
      commands: COMMANDS,
    }),
  };
}
