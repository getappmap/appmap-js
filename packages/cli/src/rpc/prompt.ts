import { PromptRpc } from '@appland/rpc';
import { RpcHandler } from './rpc';
import { collectStats, Stats } from './appmap/stats';

export const fallbackPrompts = [
  {
    name: 'What is an AppMap recording?',
    description: 'Learn about the key concepts powering Navie',
    prompt: '@help What is an AppMap recording?',
  },
  {
    name: 'How do I record my application?',
    description: 'Learn about how build deeper understanding of your application',
    prompt: '@help How do I record my application?',
  },
] as const;

function scoreRoute(route: string): number {
  let score = 0;
  if (route.match(/^(PUT|POST|DELETE)/)) {
    score += 1;
  }
  if (route.match(/\/api\//i)) {
    score += 1;
  }
  return score;
}

function getPromptsFromStats(stats: ReadonlyArray<Stats>) {
  const prompts: PromptRpc.V1.Suggestions.Response = [];
  const hasAppMaps = stats?.some(({ numAppMaps }) => numAppMaps > 0);
  if (hasAppMaps) {
    // Pick the route with the best score
    // Routes score higher if they're PUT/POST/DELETE or contain `/api/` in the path
    const routes = stats
      .flatMap(({ routes }) => routes || [])
      .map((route) => [route, scoreRoute(route)] as [string, number])
      .sort(([, a], [, b]) => b - a);
    if (routes.length) {
      // Pick a random route among the top scoring routes
      const [, highestScore] = routes[0];
      const topScoringRoutes = routes
        .filter(([, score]) => score === highestScore)
        .map(([route]) => route);
      const route = topScoringRoutes[Math.floor(topScoringRoutes.length * Math.random())];
      prompts.push({
        name: `Explain ${route}`,
        description: 'Navie can describe the behavior of a route in your application',
        prompt: `Describe the overall flow of the route "${route}"`,
      });
    }

    // Pick a random table
    const tables: string[] = stats.flatMap(({ tables }) => tables || []);
    const table: string | undefined = tables[Math.floor(tables.length * Math.random())];
    if (table) {
      prompts.push({
        name: `Describe the ${table} table`,
        description: 'Navie can describe the usage of a database table in your application',
        prompt: `Describe the usage of the table "${table}"`,
      });
    }

    // Pick a random class
    const classes: string[] = stats.flatMap(({ classes }) => classes || []);
    const chosenClass: string | undefined = classes[Math.floor(classes.length * Math.random())];
    if (chosenClass && prompts.length < 2) {
      prompts.push({
        name: `Describe the ${chosenClass} class`,
        description:
          'Navie can describe the usage and architecture around classes in your application',
        prompt: `Describe the behavior and usage of the class "${chosenClass}"`,
      });
    }
  }

  for (let i = 0; prompts.length < 2 && i < fallbackPrompts.length; i++) {
    prompts.push(fallbackPrompts[i]);
  }

  return prompts;
}

export default function promptSuggestionsV1(): RpcHandler<
  PromptRpc.V1.Suggestions.Params,
  PromptRpc.V1.Suggestions.Response
> {
  return {
    name: PromptRpc.V1.Suggestions.Method,
    async handler() {
      const stats = await collectStats();
      return getPromptsFromStats(stats);
    },
  };
}
