import yargs from 'yargs';

import * as EndpointsVerb from './verbs/endpoints';
import * as FindVerb from './verbs/find';
import * as TreeVerb from './verbs/tree';

export const command = 'query';
export const describe = 'Query AppMap recordings (endpoints, find, tree, related, hotspots, compare)';

export const builder = <T>(args: yargs.Argv<T>) =>
  args
    .command(EndpointsVerb)
    .command(FindVerb)
    .command(TreeVerb)
    .demandCommand(1, 'specify a query verb')
    .strict();

export const handler = (): void => {
  // Dispatched by subcommand. Yargs will print help if no verb is given.
};
