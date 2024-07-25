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
import CompletionService from './completion-service';
import MermaidFixerService from './mermaid-fixer-service';
import DiagramAgent from '../agents/diagram-agent';

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

const HELP_AGENT_SELECTED_MESSAGE = `It looks like you are asking for help using AppMap, so
I'm activating \`@help\` mode and basing my answer primarily on AppMap documentation. To disable this
behavior, re-ask your question and start with the option \`/nohelp\` or with a mode selector such as \`@explain\`.`;

const MODE_PREFIXES = {
  '@explain ': AgentMode.Explain,
  '@generate ': AgentMode.Generate,
  '@diagram ': AgentMode.Diagram,
  '@help ': AgentMode.Help,
  '@test ': AgentMode.Test,
  '@plan ': AgentMode.Plan,
};

export default class AgentSelectionService {
  constructor(
    private history: InteractionHistory,
    private vectorTermsService: VectorTermsService,
    private lookupContextService: LookupContextService,
    private applyContextService: ApplyContextService,
    private techStackService: TechStackService,
    private mermaidFixerService: MermaidFixerService
  ) {}

  selectAgent(
    question: string,
    classification: ContextV2.ContextLabel[],
    userOptions: UserOptions
  ): AgentModeResult {
    let modifiedQuestion = question;

    const contextService = new ContextService(
      this.history,
      this.vectorTermsService,
      this.lookupContextService,
      this.applyContextService
    );

    const helpAgent = () =>
      new HelpAgent(
        this.history,
        this.lookupContextService,
        this.vectorTermsService,
        this.techStackService
      );

    const testAgent = () => new TestAgent(this.history, contextService);

    const planAgent = () => new PlanAgent(this.history, contextService);

    const generateAgent = () => new GenerateAgent(this.history, contextService);

    const diagramAgent = () =>
      new DiagramAgent(this.history, contextService, this.mermaidFixerService);

    const explainAgent = () =>
      new ExplainAgent(this.history, contextService, this.mermaidFixerService);

    const buildAgent: { [key in AgentMode]: () => Agent } = {
      [AgentMode.Help]: helpAgent,
      [AgentMode.Generate]: generateAgent,
      [AgentMode.Diagram]: diagramAgent,
      [AgentMode.Explain]: explainAgent,
      [AgentMode.Test]: testAgent,
      [AgentMode.Plan]: planAgent,
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

    const classifierSelections: {
      name: ContextV2.ContextLabelName;
      mode: AgentMode;
      disableOption?: string;
      message?: string;
    }[] = [
      {
        name: ContextV2.ContextLabelName.HelpWithAppMap,
        mode: AgentMode.Help,
        disableOption: 'help',
        message: HELP_AGENT_SELECTED_MESSAGE,
      },
    ];

    const classifierMode = (): AgentModeResult | undefined => {
      const classifierSelection = classifierSelections.find((selection) =>
        classification.some(
          (label) =>
            label.name === selection.name &&
            label.weight === ContextV2.ContextLabelWeight.High &&
            (!selection.disableOption || userOptions.booleanValue(selection.disableOption, true))
        )
      );
      if (classifierSelection) {
        const { mode } = classifierSelection;
        this.history.log(`[mode-selection] Activating agent due to classifier: ${mode}`);
        const agent = buildAgent[mode]();
        return {
          agentMode: mode,
          question,
          agent,
          selectedByClassifier: true,
          selectionMessage: classifierSelection.message,
        };
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
