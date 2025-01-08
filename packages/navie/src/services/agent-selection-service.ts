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
import TestAgent from '../agents/test-agent';
import { PlanAgent } from '../agents/plan-agent';
import ContextService from './context-service';
import { UserOptions } from '../lib/parse-options';
import MermaidFixerService from './mermaid-fixer-service';
import DiagramAgent from '../agents/diagram-agent';
import FileChangeExtractorService from './file-change-extractor-service';
import SearchAgent from '../agents/search-agent';

type AgentModeResult = {
  agentMode: AgentMode;
  agent: Agent;
  // The question text with agent selection prefix removed.
  question: string;
  // True if the agent was selected based on classifiers (context labels).
  selectedByClassifier?: boolean;
  // Indicate to the user why the agent was selected.
  selectionMessage?: string;
};

const MODE_PREFIXES = {
  '@explain ': AgentMode.Explain,
  '@search ': AgentMode.Search,
  '@diagram ': AgentMode.Diagram,
  '@plan ': AgentMode.Plan,
  '@generate ': AgentMode.Generate,
  '@test ': AgentMode.Test,
  '@help ': AgentMode.Help,
};

export default class AgentSelectionService {
  constructor(
    private history: InteractionHistory,
    private vectorTermsService: VectorTermsService,
    private lookupContextService: LookupContextService,
    private fileChangeExtractorService: FileChangeExtractorService,
    private applyContextService: ApplyContextService,
    private techStackService: TechStackService,
    private mermaidFixerService: MermaidFixerService
  ) {
    this.contextService = new ContextService(
      this.history,
      this.vectorTermsService,
      this.lookupContextService,
      this.applyContextService
    );
  }
  contextService: ContextService;

  selectAgent(
    question: string,
    classification: ContextV2.ContextLabel[],
    userOptions: UserOptions
  ): AgentModeResult {
    let modifiedQuestion = question;

    const helpAgent = () =>
      new HelpAgent(
        this.history,
        this.lookupContextService,
        this.vectorTermsService,
        this.techStackService
      );

    const testAgent = () =>
      new TestAgent(this.history, this.contextService, this.fileChangeExtractorService);

    const planAgent = () => new PlanAgent(this.history, this.contextService);

    const generateAgent = () =>
      new GenerateAgent(this.history, this.contextService, this.fileChangeExtractorService);

    const diagramAgent = () =>
      new DiagramAgent(this.history, this.contextService, this.mermaidFixerService);

    const explainAgent = () =>
      new ExplainAgent(this.history, this.contextService, this.mermaidFixerService);

    const searchAgent = () => new SearchAgent(this.history, this.contextService);

    const buildAgent: { [key in AgentMode]: () => Agent } = {
      [AgentMode.Explain]: explainAgent,
      [AgentMode.Search]: searchAgent,
      [AgentMode.Diagram]: diagramAgent,
      [AgentMode.Plan]: planAgent,
      [AgentMode.Generate]: generateAgent,
      [AgentMode.Test]: testAgent,
      [AgentMode.Help]: helpAgent,
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

    const defaultMode = () => {
      this.history.log(`[mode-selection] Using default mode: ${AgentMode.Explain}`);
      return { agentMode: AgentMode.Explain, question, agent: explainAgent() };
    };

    const result = questionPrefixMode() || defaultMode();
    this.history.addEvent(new AgentSelectionEvent(result.agentMode));
    return result;
  }
}
