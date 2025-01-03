import { UserContext } from '@appland/navie';
import { ActivityRpc, ExplainRpc } from '@appland/rpc';

import { INavieProvider } from '../explain/navie/inavie';
import { RpcHandler } from '../rpc';
import { explain, explainStatus } from '../explain/explain';
import { warn } from 'console';
import { currentActivity } from './current';

interface SearchResult {
  location: string;
  description: string;
}

export async function activityTestsV1(
  navieProvider: INavieProvider,
  args: ActivityRpc.V1.Suggest.Tests.Params
): Promise<ActivityRpc.V1.Suggest.Tests.Response> {
  const { codeSelection, paths, keywords } = args;

  const activity = await currentActivity();
  // TODO: If the activity has not changed, return cached results
  // The cache key should include the activity digest, code selection, prompt, paths, and keywords

  const diffs = activity.projectStates.flatMap((state) => state.diffs);
  const userContext: UserContext.ContextItem[] = diffs.map((diff) => ({
    type: 'code-selection', // TODO: Indicate to the LLM that these context items are diffs?
    content: diff,
  }));

  if (codeSelection) {
    userContext.push({
      type: 'code-selection',
      content: codeSelection,
    });
  }

  const questionTokens = [
    '@search',
    '/noprojectinfo',
    '/noclassify',
    '/format=json',
    '/tokenlimit=4000',
    '/include=test|spec',
    'Identify test cases that are relevant to',
  ];
  if (keywords) {
    questionTokens.push('the following keywords:');
    questionTokens.push(...keywords);
  } else {
    questionTokens.push('the work in progress');
  }
  const explainResponse = await explain(
    navieProvider,
    questionTokens.join(' '),
    userContext,
    undefined, // appmaps
    undefined, // threadId
    undefined, // codeEditor
    undefined // prompt
  );

  let status: ExplainRpc.ExplainStatusResponse | undefined;

  const awaitCompletion = async (interval: number, timeout: number) => {
    const finalSteps = [ExplainRpc.Step.COMPLETE, ExplainRpc.Step.ERROR];
    const complete = () => status && finalSteps.includes(status.step);

    let remaining = timeout;
    while (!complete()) {
      await new Promise((resolve) => setTimeout(resolve, interval));

      status = explainStatus(explainResponse.userMessageId);
      remaining = remaining - interval;
      if (remaining <= 0) {
        warn(`[activity-tests] Timed out waiting for @search operation`);
        break;
      }
    }
  };

  await awaitCompletion(2, 30000);

  if (status?.step !== ExplainRpc.Step.COMPLETE) throw new Error(`completion failed`);

  const outputStr = (status.explanation ?? []).join('');
  let response: SearchResult[] = [];
  try {
    response = JSON.parse(outputStr) as SearchResult[];
  } catch {
    warn(`[activity-tests] Failed to parse response: ${outputStr}`);
  }

  // Filter results based on specified paths
  if (paths && paths.length > 0) {
    response = response.filter((result) => paths.some((path) => result.location.includes(path)));
  }

  // Refine results by removing file path comments
  response = response.map((result) => ({
    ...result,
    location: result.location.replace(/<!-- file: .* -->/g, '').trim(),
  }));
  return response;
}

export function activityTestsV1RpcHandler(
  navie: INavieProvider
): RpcHandler<ActivityRpc.V1.Suggest.Tests.Params, ActivityRpc.V1.Suggest.Tests.Response> {
  return {
    name: ActivityRpc.V1.Suggest.Tests.Method,
    handler: (args: ActivityRpc.V1.Suggest.Tests.Params) => activityTestsV1(navie, args),
  };
}
