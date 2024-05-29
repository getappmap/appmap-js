/* eslint-disable default-case */
/* eslint-disable consistent-return */
import InteractionHistory, { AgentSelectionEvent } from '../interaction-history';
import { Agent, AgentMode } from '../agent';
import HelpAgent from '../agents/help-agent';
import GenerateAgent from '../agents/generate-agent';
import ExplainAgent from '../agents/explain-agent';
import VectorTermsService from './vector-terms-service';
import LookupContextService from './lookup-context-service';
import ApplyContextService from './apply-context-service';
import { ContextV2 } from '../context';
import TechStackService from './tech-stack-service';

type AgentModeResult = { agentMode: AgentMode; agent: Agent; question: string };

const MODE_PREFIXES = {
  '@explain ': AgentMode.Explain,
  '@generate ': AgentMode.Generate,
  '@help ': AgentMode.Help,
};

export default class AgentSelectionService {
  constructor(
    private history: InteractionHistory,
    private vectorTermsService: VectorTermsService,
    private lookupContextService: LookupContextService,
    private applyContextService: ApplyContextService,
    private techStackService: TechStackService
  ) {}

  selectAgent(question: string, classification: ContextV2.ContextLabel[]): AgentModeResult {
    let modifiedQuestion = question;

    const helpAgent = () =>
      new HelpAgent(
        this.history,
        this.lookupContextService,
        this.vectorTermsService,
        this.techStackService
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
    };

    const questionPrefixMode = () => {
      const startLine = question.split('\n')[0];
      for (const [prefix, mode] of Object.entries(MODE_PREFIXES)) {
        let detectedMode = false;
        if (startLine.trim() === prefix.trim()) {
          detectedMode = true;
          modifiedQuestion = question.split('\n').slice(1).join('\n');
        }

        if (question.startsWith(prefix)) {
          detectedMode = true;
          modifiedQuestion = question.slice(prefix.length);
        }

        if (detectedMode) {
          this.history.log(`[mode-selection] Activating agent due to question prefix: ${mode}`);
          const agent = buildAgent[mode]();
          return { agentMode: mode, question: modifiedQuestion, agent };
        }
      }
    };

    const classifierMode = () => {
      const isHelp = classification.some(
        (label) =>
          label.name === ContextV2.ContextLabelName.HelpWithAppMap &&
          label.weight === ContextV2.ContextLabelWeight.High
      );
      if (isHelp) {
        this.history.log(`[mode-selection] Activating agent due to classifier: ${AgentMode.Help}`);
        return { agentMode: AgentMode.Help, question, agent: helpAgent() };
      }
    };

    const defaultMode = () => {
      this.history.log(`[mode-selection] Using default mode: ${AgentMode.Explain}`);
      return { agentMode: AgentMode.Explain, question, agent: explainAgent() };
    };

    const result = questionPrefixMode() || classifierMode() || defaultMode();
    this.history.addEvent(new AgentSelectionEvent(result.agentMode));
    return result;
  }
}
