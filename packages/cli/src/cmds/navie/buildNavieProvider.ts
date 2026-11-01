import chalk from 'chalk';

import { Agents, ContextV2, Help, ProjectInfo, TestInvocation } from '@appland/navie';
import { InteractionEvent } from '@appland/navie/dist/interaction-history';

import LocalNavie from '../../rpc/explain/navie/navie-local';
import NopNavie from '../../rpc/explain/navie/navie-nop';
import Trajectory from '../../rpc/explain/navie/trajectory';
import type { ExplainArgs } from './commonNavieArgs';

export default function buildNavieProvider(argv: ExplainArgs) {
  const { logNavie } = argv;
  let aiOptions: string[] | undefined = argv.aiOption;
  if (aiOptions) {
    aiOptions = Array.isArray(aiOptions) ? aiOptions : [aiOptions];
  }
  const agentModeStr: string | undefined = argv.agentMode;
  let agentMode: Agents | undefined;
  if (agentModeStr) agentMode = agentModeStr as Agents;

  const applyAIOptions = (navie: LocalNavie | NopNavie) => {
    if (aiOptions) {
      for (const option of aiOptions) {
        const [key, value] = option.split('=');
        if (key && value) {
          navie.setOption(key, value);
        }
      }
    }
    if (agentMode) {
      navie.setOption('explainMode', agentMode);
    }
  };

  const buildLocalNavie = (
    contextProvider: ContextV2.ContextProvider,
    projectInfoProvider: ProjectInfo.ProjectInfoProvider,
    helpProvider: Help.HelpProvider,
    testInvocationProvider: TestInvocation.TestInvocationProvider
  ) => {
    const navie = new LocalNavie(contextProvider, projectInfoProvider, helpProvider, testInvocationProvider);

    if (argv.threadId) navie.setThreadId(argv.threadId);
    if (argv.trajectoryFile) {
      const trajectory = new Trajectory(argv.trajectoryFile);
      navie.setTrajectoryHandler(trajectory);

      process.on('exit', () => trajectory.close());
    }
    applyAIOptions(navie);

    let START: number | undefined;
    const logEvent = (event: InteractionEvent) => {
      if (!logNavie) return;

      if (!START) START = Date.now();

      const elapsed = Date.now() - START;
      process.stderr.write(chalk.gray(`${elapsed}ms `));
      process.stderr.write(chalk.gray(event.message));
      process.stderr.write(chalk.gray('\n'));
    };

    navie.on('event', logEvent);
    return navie;
  };

  return buildLocalNavie;
}
