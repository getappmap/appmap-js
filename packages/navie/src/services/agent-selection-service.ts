/* eslint-disable default-case */
/* eslint-disable consistent-return */
import { ExplainOptions } from '../explain';
import InteractionHistory from '../interaction-history';
import { Agent, AgentMode } from '../agent';
import { ProjectInfo } from '../project-info';
import { HelpAgent } from '../agents/help-agent';
import { HelpProvider } from '../help';
import VectorTermsService from './vector-terms-service';
import { GenerateAgent } from '../agents/generate-agent';
import LookupContextService from './lookup-context-service';
import ApplyContextService from './apply-context-service';
import ExplainAgent from '../agents/explain-agent';

type AgentModeResult = { agent: Agent; question: string };

const MODE_PREFIXES = {
  '@explain ': AgentMode.Explain,
  '@generate ': AgentMode.Generate,
  '@help ': AgentMode.Help,
};

export default class AgentSelectionService {
  constructor(
    private history: InteractionHistory,
    private helpProvider: HelpProvider,
    private vectorTermsService: VectorTermsService,
    private lookupContextService: LookupContextService,
    private applyContextService: ApplyContextService
  ) {}

  selectAgent(
    question: string,
    options: ExplainOptions,
    projectInfo: ProjectInfo[]
  ): AgentModeResult {
    let modifiedQuestion = question;
    const hasAppMaps = projectInfo.some((info) => info.appmapStats.numAppMaps > 0);

    const helpAgent = () => new HelpAgent(this.history, this.helpProvider, this.vectorTermsService);

    const generateAgent = () =>
      new GenerateAgent(
        this.history,
        this.vectorTermsService,
        this.lookupContextService,
        this.applyContextService
      );

    const explainAgent = () =>
      new ExplainAgent(
        this.history,
        this.vectorTermsService,
        this.lookupContextService,
        this.applyContextService
      );

    const buildAgent = {
      [AgentMode.Help]: helpAgent,
      [AgentMode.Generate]: generateAgent,
      [AgentMode.Explain]: explainAgent,
    };

    const optionMode = () => {
      if (options.agentMode) {
        this.history.log(
          `[mode-selection] Activating agent due to explicit option: ${options.agentMode}`
        );
        const agent = buildAgent[options.agentMode]();
        return { question, agent };
      }
    };

    const questionPrefixMode = () => {
      for (const [prefix, mode] of Object.entries(MODE_PREFIXES)) {
        if (question.startsWith(prefix)) {
          modifiedQuestion = question.slice(prefix.length);
          this.history.log(`[mode-selection] Activating agent due to question prefix: ${mode}`);
          const agent = buildAgent[mode]();
          return { question: modifiedQuestion, agent };
        }
      }
    };

    const noAppMapsMode = () => {
      if (!hasAppMaps) {
        this.history.log(`[mode-selection] Activating Help mode because no AppMaps were detected.`);
        return { question, agent: helpAgent() };
      }
    };

    const defaultMode = () => {
      this.history.log(`[mode-selection] Using default mode: ${AgentMode.Explain}`);
      return { question, agent: explainAgent() };
    };

    return optionMode() || questionPrefixMode() || noAppMapsMode() || defaultMode();
  }
}
