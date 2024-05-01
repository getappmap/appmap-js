import assert from 'assert';
import { AgentMode } from './agent';
import { ExplainOptions } from './explain';

const BOOLEAN_STRINGS: Record<string, boolean> = {
  true: true,
  false: false,
  yes: true,
  no: false,
  y: true,
  n: false,
};

export enum CommandOptionName {
  Model = 'model',
  Tokens = 'tokens',
  Temperature = 'temperature',
  ResponseTokens = 'response-tokens',
  ProjectInfo = 'project-info',
  Context = 'context',
  FileName = 'file',
}

export function commandOptionName(value: string): CommandOptionName | undefined {
  const valueWithoutDash = value.replace(/^-+/, '');
  return Object.values(CommandOptionName).find((item) => item === valueWithoutDash.toLowerCase());
}

export type CommandOption = {
  name: CommandOptionName;
  value: string | boolean | number;
};

export type CommandOptions = CommandOption[];

export type OptionParseResult = {
  question: string;
  agentMode?: AgentMode;
  options: CommandOptions;
};

export function parseOptions(question: string): OptionParseResult {
  const parts = question.split(' ');

  const agentPart = parts[0];
  let agentMode: AgentMode | undefined;
  if (agentPart.startsWith('@')) {
    parts.shift();
    agentMode = agentPart.slice(1) as AgentMode;
  }

  // Parse options until we find the first non-option part
  const options: CommandOptions = [];
  for (const part of parts) {
    if (!part.startsWith('/')) break;

    const [key, valueStr] = part.slice(1).split('=');
    const name = commandOptionName(key);
    // eslint-disable-next-line no-continue
    if (!name) continue;
    assert(name);

    let value: string | boolean | number = true;
    if (typeof valueStr === 'string') {
      const booleanValue = BOOLEAN_STRINGS[valueStr.toLowerCase()];
      if (booleanValue !== undefined) value = booleanValue;
      else if (!Number.isNaN(Number(valueStr))) value = Number(valueStr);
    }
    options.push({
      name,
      value,
    });
  }

  return { agentMode, options, question: parts.join(' ') };
}

export function applyCommandOptions(options: CommandOptions, explainOptions: ExplainOptions): void {
  for (const option of options) {
    switch (option.name) {
      case CommandOptionName.Model:
        explainOptions.modelName = option.value as string;
        break;
      case CommandOptionName.Tokens:
        explainOptions.tokenLimit = option.value as number;
        break;
      case CommandOptionName.Temperature:
        explainOptions.temperature = option.value as number;
        break;
      case CommandOptionName.ResponseTokens:
        explainOptions.responseTokens = option.value as number;
        break;
      case CommandOptionName.ProjectInfo:
        explainOptions.fetchProjectInfo = option.value as boolean;
        break;
      case CommandOptionName.Context:
        explainOptions.fetchContext = option.value as boolean;
        break;
      default:
    }
  }
}
