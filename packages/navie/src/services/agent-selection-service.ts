/* eslint-disable default-case */
/* eslint-disable consistent-return */
import InteractionHistory from '../interaction-history';
import { Agent, AgentMode } from '../agent';
import { HelpAgent } from '../agents/help-agent';
import { HelpProvider } from '../help';
import VectorTermsService from './vector-terms-service';
import { GenerateAgent } from '../agents/generate-agent';
import LookupContextService from './lookup-context-service';
import ApplyContextService from './apply-context-service';
import ExplainAgent from '../agents/explain-agent';
import { IssueAgent } from '../agents/issue-agent';

export default class AgentSelectionService {
  constructor(
    private history: InteractionHistory,
    private helpProvider: HelpProvider,
    private vectorTermsService: VectorTermsService,
    private lookupContextService: LookupContextService,
    private applyContextService: ApplyContextService
  ) {}

  buildAgent(agentMode?: AgentMode): Agent {
    const helpAgent = () => new HelpAgent(this.history, this.helpProvider, this.vectorTermsService);

    const issueAgent = () =>
      new IssueAgent(
        this.history,
        this.vectorTermsService,
        this.lookupContextService,
        this.applyContextService
      );

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
      [AgentMode.Issue]: issueAgent,
    };

    return buildAgent[agentMode || AgentMode.Explain]();
  }
}
