import { lstatSync, readdirSync } from 'fs';

export function allRules(): string[] {
  return readdirSync('./src/rules').filter(isRuleFile);
}

export function isRuleFile(ruleFile: string): boolean {
  return !lstatSync(ruleFilePath('.', ruleFile)).isDirectory() && ruleFile !== 'types.d.ts';
}

export function ruleFilePath(prefix: string, ruleFile: string): string {
  return `${prefix}/src/rules/${ruleFile}`;
}
