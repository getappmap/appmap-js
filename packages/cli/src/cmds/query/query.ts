import yargs from 'yargs';

import * as CompareVerb from './verbs/compare';
import * as EndpointsVerb from './verbs/endpoints';
import * as FindVerb from './verbs/find';
import * as HotspotsVerb from './verbs/hotspots';
import * as McpVerb from './verbs/mcp';
import * as RelatedVerb from './verbs/related';
import * as TreeVerb from './verbs/tree';
import * as UiVerb from './verbs/ui';

export const command = 'query';
export const describe =
  'Query AppMap recordings (endpoints, find, tree, related, hotspots, compare, mcp, ui)';

export const builder = <T>(args: yargs.Argv<T>) =>
  args
    .command(CompareVerb)
    .command(EndpointsVerb)
    .command(FindVerb)
    .command(HotspotsVerb)
    .command(McpVerb)
    .command(RelatedVerb)
    .command(TreeVerb)
    .command(UiVerb)
    .demandCommand(1, 'specify a query verb')
    .strict();

export const handler = (): void => {
  // Dispatched by subcommand. Yargs will print help if no verb is given.
};
